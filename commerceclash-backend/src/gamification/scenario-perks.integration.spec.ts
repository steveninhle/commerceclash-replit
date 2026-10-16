import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { Logger } from '@nestjs/common';
import { ClassService } from '../class/class.service';
import { ClassGateway } from '../class/class.gateway';
import { AppConfigService } from '@utils/config/config.service';
import { ReusableService } from '@utils/common/classes/reusable';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@utils/prisma/prisma.service';
import { Afterburner } from './systems/Afterburner';
import { Extortion } from './systems/Extortion';
import { InsiderTrading } from './systems/InsiderTrading';
import { IPerkEffectContext } from './core/interfaces/IPerkEffect';
import { endScenarioEffects, temporaryModifiers } from './utils/scenarioEffects';
import { provisionStudentPerk } from './utils/provisionStudentPerk';
import { SkillsService } from '../skills/skills.service';
import { UPCOMING_SCENARIO_TYPE } from './utils/types/types';

const url = process.env.PERK_TEST_DATABASE_URL;
// These tests deliberately reset fixtures. Never fall back to DATABASE_URL.
if (url) {
  const parsed = new URL(url);
  if (!['127.0.0.1', 'localhost'].includes(parsed.hostname) || parsed.pathname !== '/perk_tests') {
    throw new Error('PERK_TEST_DATABASE_URL must point to local /perk_tests.');
  }
}
const integration = url ? describe : describe.skip;

integration('Scenario perks (PostgreSQL)', () => {
  const prisma = new PrismaClient({
    datasourceUrl: url ?? 'postgresql://unused/unused',
  }) as PrismaService;
  let ctx: IPerkEffectContext;
  let rivalId: string;
  let rivalEnrollmentId: string;
  let ownSkillId: string;
  let rivalSkillId: string;
  let archetypeId: string;
  let perkTypeId: string;

  beforeAll(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    await prisma.$connect();
  });
  afterAll(async () => {
    await prisma.$disconnect();
    jest.restoreAllMocks();
  });
  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE roles, archtypes, attributes, perk_types CASCADE');
    const role = await prisma.roles.create({ data: { name: 'test' } });
    const [studentId, teacherId] = [randomUUID(), randomUUID()];
    rivalId = randomUUID();
    await prisma.users.createMany({
      data: [studentId, teacherId, rivalId].map((id) => ({
        id,
        role_id: role.id,
        email: `${id}@test.invalid`,
        name: id,
      })),
    });
    const classroom = await prisma.renamedclass.create({
      data: { instructor_id: teacherId, name: 'test', meeting_id: 'test', meeting_link: 'test' },
    });
    const archetype = await prisma.archtypes.create({
      data: { title: 'test', difficulty: 1, playstyle: 'test', risk: 1, influence: 1, growth: 1 },
    });
    archetypeId = archetype.id;
    const enrollment = await prisma.enrolled_students.create({
      data: {
        student_id: studentId,
        class_id: classroom.id,
        archtype_id: archetype.id,
        available_points: 5,
        level: 5,
      },
    });
    const rival = await prisma.enrolled_students.create({
      data: { student_id: rivalId, class_id: classroom.id, archtype_id: archetype.id },
    });
    rivalEnrollmentId = rival.id;
    const attribute = await prisma.attributes.create({ data: { name: 'team' } });
    const ownSkill = await prisma.student_attributes.create({
      data: { enrollment_id: enrollment.id, attribute_id: attribute.id, value: 5 },
    });
    const rivalSkill = await prisma.student_attributes.create({
      data: { enrollment_id: rival.id, attribute_id: attribute.id, value: 4 },
    });
    ownSkillId = ownSkill.id;
    rivalSkillId = rivalSkill.id;
    perkTypeId = (await prisma.perk_types.create({ data: { type: 'active' } })).id;
    ctx = {
      student: { id: studentId, name: 'Student', enrollmentId: enrollment.id },
      classId: classroom.id,
      perk: { id: '', title: '' },
    };
  });
  afterEach(async () => {
    await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS reject_usage ON perk_usage');
    await prisma.$executeRawUnsafe('DROP FUNCTION IF EXISTS reject_perk_usage()');
  });

  async function template(key: string, repeatable = true) {
    return prisma.perks.create({
      data: {
        key,
        title: key,
        is_coded: true,
        is_repeatable: repeatable,
        auto_approve: true,
        archtype_id: archetypeId,
        perk_type: perkTypeId,
      },
    });
  }
  async function setup(key: string, repeatable = true) {
    const perk = await template(key, repeatable);
    const owned = await prisma.student_perks.create({
      data: {
        enrollment_id: ctx.student.enrollmentId,
        perk_id: perk.id,
        is_unlocked: true,
        perk_status: 'approved',
        is_approved: true,
      },
    });
    ctx.perk = { id: owned.id, title: key };
    return owned;
  }
  const skill = (id: string) => prisma.student_attributes.findUniqueOrThrow({ where: { id } });
  const owned = () => prisma.student_perks.findUniqueOrThrow({ where: { id: ctx.perk.id } });
  const classService = () =>
    new ClassService(
      {
        getZakCookieOptions: () => ({}),
      } as unknown as AppConfigService,
      prisma,
      {} as ClassGateway,
      new ReusableService(prisma),
    );
  async function rejectLedger(operation: 'INSERT' | 'UPDATE') {
    await prisma.$executeRawUnsafe(
      "CREATE FUNCTION reject_perk_usage() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected ledger failure'; END $$",
    );
    await prisma.$executeRawUnsafe(
      `CREATE TRIGGER reject_usage BEFORE ${operation} ON perk_usage FOR EACH ROW EXECUTE FUNCTION reject_perk_usage()`,
    );
  }

  it('Afterburner adds exactly two temporary points without changing permanent skills or the pool', async () => {
    await setup('afterburner');
    expect((await new Afterburner(prisma).apply(ctx)).success).toBe(true);
    expect((await skill(ownSkillId)).value).toBe(5);
    expect((await temporaryModifiers(prisma, ctx.classId)).get(ownSkillId)).toBe(2);
    expect(
      (
        await prisma.enrolled_students.findUniqueOrThrow({
          where: { id: ctx.student.enrollmentId },
        })
      ).available_points,
    ).toBe(5);
    const result = await new SkillsService(prisma).getStudentSkill(ctx.student.enrollmentId);
    expect('orderedSkills' in result && result.orderedSkills[0]).toMatchObject({
      value: 5,
      temporaryValue: 2,
      effectiveValue: 7,
    });
  });
  it('cannot refund temporary points through the skill allocator', async () => {
    await setup('afterburner');
    await new Afterburner(prisma).apply(ctx);
    const result = await new SkillsService(prisma).updateSkill(
      ctx.student.enrollmentId,
      ctx.classId,
      ctx.student.id,
      ownSkillId,
      0,
    );
    expect(result.available_points).toBe(10);
    await endScenarioEffects(prisma, ctx.classId);
    expect((await skill(ownSkillId)).value).toBe(0);
    expect(
      (
        await prisma.enrolled_students.findUniqueOrThrow({
          where: { id: ctx.student.enrollmentId },
        })
      ).available_points,
    ).toBe(10);
  });
  it('preserves permanent edits and refunds when a scenario ends', async () => {
    await setup('afterburner');
    await new Afterburner(prisma).apply(ctx);
    const result = await new SkillsService(prisma).updateSkill(
      ctx.student.enrollmentId,
      ctx.classId,
      ctx.student.id,
      ownSkillId,
      4,
    );
    expect(result.available_points).toBe(6);
    await endScenarioEffects(prisma, ctx.classId);
    expect((await skill(ownSkillId)).value).toBe(4);
    expect((await temporaryModifiers(prisma, ctx.classId)).size).toBe(0);
  });
  it('rejects insufficient Afterburner capacity without consuming it', async () => {
    await setup('afterburner');
    await prisma.student_attributes.update({ where: { id: ownSkillId }, data: { value: 7 } });
    expect((await new Afterburner(prisma).apply(ctx)).success).toBe(false);
    expect((await owned()).is_used).toBe(false);
    expect(await prisma.perk_usage.count()).toBe(0);
  });
  it('allows only one concurrent Afterburner activation and one cleanup', async () => {
    await setup('afterburner');
    const results = await Promise.allSettled([
      new Afterburner(prisma).apply(ctx),
      new Afterburner(prisma).apply(ctx),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const endings = await Promise.all([
      endScenarioEffects(prisma, ctx.classId),
      endScenarioEffects(prisma, ctx.classId),
    ]);
    expect(endings.reduce((sum, r) => sum + r.data.revertedEffects, 0)).toBe(1);
    expect((await skill(ownSkillId)).value).toBe(5);
  });
  it('blocks another Afterburner while its modifier is active even after cooldown', async () => {
    await setup('afterburner');
    await new Afterburner(prisma).apply(ctx);
    await prisma.student_perks.update({
      where: { id: ctx.perk.id },
      data: { next_available_at: new Date(0), is_approved: true },
    });
    await expect(new Afterburner(prisma).apply(ctx)).rejects.toThrow('already active');
    await endScenarioEffects(prisma, ctx.classId);
    expect((await new Afterburner(prisma).apply(ctx)).success).toBe(true);
  });
  it('Extortion opens target selection without consuming the perk or changing skills', async () => {
    await setup('extortion', false);
    const result = await new Extortion(prisma).apply(ctx);
    expect(result.data).toMatchObject({ pendingCompletion: true, rivals: [{ id: rivalId }] });
    expect((await owned()).is_used).toBe(false);
    expect(await prisma.perk_usage.count()).toBe(0);
  });
  it('Extortion transfers exactly two scenario points and restores the display after permanent edits', async () => {
    await setup('extortion', false);
    ctx.additionalData = { targetStudentId: rivalId };
    const balances = await prisma.enrolled_students.findMany({
      where: { class_id: ctx.classId },
      select: { id: true, market_share: true },
      orderBy: { id: 'asc' },
    });
    await new Extortion(prisma).apply(ctx);
    expect(
      await prisma.enrolled_students.findMany({
        where: { class_id: ctx.classId },
        select: { id: true, market_share: true },
        orderBy: { id: 'asc' },
      }),
    ).toEqual(balances);
    const modifiers = await temporaryModifiers(prisma, ctx.classId);
    expect(modifiers.get(ownSkillId)).toBe(2);
    expect(modifiers.get(rivalSkillId)).toBe(-2);
    expect((await skill(rivalSkillId)).value).toBe(4);
    await prisma.student_attributes.update({ where: { id: rivalSkillId }, data: { value: 8 } });
    await endScenarioEffects(prisma, ctx.classId);
    expect((await skill(rivalSkillId)).value).toBe(8);
    expect((await skill(ownSkillId)).value).toBe(5);
    await expect(new Extortion(prisma).apply(ctx)).rejects.toThrow('unavailable');
  });
  it('rejects self-targets and students outside the class', async () => {
    await setup('extortion', false);
    for (const targetStudentId of [ctx.student.id, randomUUID()]) {
      await expect(
        new Extortion(prisma).apply({ ...ctx, additionalData: { targetStudentId } }),
      ).rejects.toThrow('not eligible');
    }
    expect(await prisma.perk_usage.count()).toBe(0);
  });
  it('requires the Extortion selection window to be open', async () => {
    await setup('extortion', false);
    await prisma.student_perks.update({ where: { id: ctx.perk.id }, data: { perk_status: null } });
    await expect(
      new Extortion(prisma).apply({ ...ctx, additionalData: { targetStudentId: rivalId } }),
    ).rejects.toThrow('Start the scenario');
  });
  it('rechecks target capacity at completion', async () => {
    await setup('extortion', false);
    await new Extortion(prisma).apply(ctx);
    await prisma.student_attributes.update({ where: { id: rivalSkillId }, data: { value: 1 } });
    expect(
      (await new Extortion(prisma).apply({ ...ctx, additionalData: { targetStudentId: rivalId } }))
        .success,
    ).toBe(false);
    expect((await owned()).is_used).toBe(false);
  });
  it('serializes duplicate Extortion completions', async () => {
    await setup('extortion', false);
    ctx.additionalData = { targetStudentId: rivalId };
    const results = await Promise.allSettled([
      new Extortion(prisma).apply(ctx),
      new Extortion(prisma).apply(ctx),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await prisma.perk_usage.count()).toBe(1);
    expect((await temporaryModifiers(prisma, ctx.classId)).get(rivalSkillId)).toBe(-2);
  });
  it('does not reset a consumed Extortion when a duplicate completion fails in the class service', async () => {
    await setup('extortion', false);
    const service = classService();
    await service.triggerExtortionForScenarioStart(ctx.classId, ctx.student.id);
    const activate = () =>
      service.activatePerkAfterApproval(ctx.classId, ctx.student.id, ctx.perk.id, {
        targetStudentId: rivalId,
      });
    await activate();
    await expect(activate()).rejects.toThrow();
    expect((await owned()).is_used).toBe(true);
    expect((await owned()).perk_status).toBeNull();
    expect(await prisma.perk_usage.count()).toBe(2);
  });
  it('releases a failed reactive reservation so Insider Trading can retry', async () => {
    await setup('insider_trading');
    await rejectLedger('INSERT');
    const service = classService();
    await expect(
      service.triggerInsiderTradingReveal(ctx.classId, ctx.student.id),
    ).rejects.toThrow();
    expect((await prisma.student_perks.findFirstOrThrow()).perk_status).toBe('approved');
    await prisma.$executeRawUnsafe('DROP TRIGGER reject_usage ON perk_usage');
    expect((await service.triggerInsiderTradingReveal(ctx.classId, ctx.student.id)).success).toBe(
      true,
    );
  });
  it('rejects a locked perk without recording a scenario effect', async () => {
    await setup('afterburner');
    await prisma.student_perks.update({ where: { id: ctx.perk.id }, data: { is_unlocked: false } });
    await expect(new Afterburner(prisma).apply(ctx)).rejects.toThrow();
    expect(await prisma.perk_usage.count()).toBe(0);
  });
  it.each(['afterburner', 'extortion', 'insider_trading'])(
    'rolls back %s consumption when ledger insertion fails',
    async (key) => {
      await setup(key, key !== 'extortion');
      ctx.additionalData = { targetStudentId: rivalId };
      await rejectLedger('INSERT');
      const effect =
        key === 'afterburner'
          ? new Afterburner(prisma)
          : key === 'extortion'
            ? new Extortion(prisma)
            : new InsiderTrading(prisma);
      await expect(effect.apply(ctx)).rejects.toThrow();
      expect((await owned()).is_used).toBe(false);
      expect((await owned()).perk_status).toBe('approved');
      expect(await prisma.perk_usage.count()).toBe(0);
      expect((await skill(ownSkillId)).value).toBe(5);
      expect((await skill(rivalSkillId)).value).toBe(4);
    },
  );
  it('keeps active modifiers intact if cleanup fails and can retry', async () => {
    await setup('afterburner');
    await new Afterburner(prisma).apply(ctx);
    await rejectLedger('UPDATE');
    await expect(endScenarioEffects(prisma, ctx.classId)).rejects.toThrow();
    expect((await temporaryModifiers(prisma, ctx.classId)).get(ownSkillId)).toBe(2);
    await prisma.$executeRawUnsafe('DROP TRIGGER reject_usage ON perk_usage');
    expect((await endScenarioEffects(prisma, ctx.classId)).data.revertedEffects).toBe(1);
  });
  it('Insider Trading reveals the shared hard-coded type and respects cooldown', async () => {
    await setup('insider_trading');
    const effect = new InsiderTrading(prisma);
    expect((await effect.apply(ctx)).data).toMatchObject({ scenarioType: UPCOMING_SCENARIO_TYPE });
    await expect(effect.apply(ctx)).rejects.toThrow();
    await prisma.student_perks.update({
      where: { id: ctx.perk.id },
      data: { next_available_at: new Date(0), is_approved: true },
    });
    expect((await effect.apply(ctx)).success).toBe(true);
  });
  it.each(['afterburner', 'extortion', 'insider_trading'])(
    "rejects using another enrollment's %s",
    async (key) => {
      await setup(key);
      const effect =
        key === 'afterburner'
          ? new Afterburner(prisma)
          : key === 'extortion'
            ? new Extortion(prisma)
            : new InsiderTrading(prisma);
      await expect(
        effect.apply({
          ...ctx,
          student: { id: rivalId, name: 'Rival', enrollmentId: rivalEnrollmentId },
        }),
      ).rejects.toThrow();
      expect(await prisma.perk_usage.count()).toBe(0);
    },
  );
  it('provisions and reserves a reactive perk only once under concurrent requests', async () => {
    await setup('extortion', false);
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        provisionStudentPerk(prisma, ctx.student.enrollmentId, 'extortion'),
      ),
    );
    expect(results.filter((result) => result.status === 'ready')).toHaveLength(1);
    expect(await prisma.student_perks.count()).toBe(1);
  });
  it('database uniqueness also rejects duplicate instances created outside provisioning', async () => {
    const instance = await setup('extortion', false);
    await expect(
      prisma.student_perks.create({
        data: { enrollment_id: instance.enrollment_id, perk_id: instance.perk_id },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });
  it('cancels an unfinished Extortion picker when the scenario ends', async () => {
    await setup('extortion', false);
    await new Extortion(prisma).apply(ctx);
    await endScenarioEffects(prisma, ctx.classId);
    await expect(
      new Extortion(prisma).apply({ ...ctx, additionalData: { targetStudentId: rivalId } }),
    ).rejects.toThrow('Teacher approval');
    expect((await owned()).is_used).toBe(false);
  });
  it("does not clear another class's modifiers", async () => {
    await setup('afterburner');
    await new Afterburner(prisma).apply(ctx);
    await endScenarioEffects(prisma, randomUUID());
    expect((await temporaryModifiers(prisma, ctx.classId)).get(ownSkillId)).toBe(2);
  });
  it('migrates new perks to teacher approval and backfills level-gated instances', async () => {
    const instance = await setup('spotlight');
    await prisma.student_perks.update({ where: { id: instance.id }, data: { is_used: true } });
    execFileSync(
      process.execPath,
      [
        require.resolve('prisma/build/index.js'),
        'db',
        'execute',
        '--file',
        resolve('prisma/migrations/20261006000000_teacher_approval_new_perks/migration.sql'),
        '--schema',
        resolve('prisma/schema.prisma'),
      ],
      {
        env: { ...process.env, DATABASE_URL: url!, DIRECT_URL: url! },
        stdio: 'pipe',
      },
    );
    expect(
      (await prisma.perks.findUniqueOrThrow({ where: { key: 'spotlight' } })).auto_approve,
    ).toBe(false);
    expect(await owned()).toMatchObject({
      is_approved: false,
      perk_status: null,
      is_used: true,
      is_unlocked: true,
    });
    expect(
      await prisma.student_perks.findFirstOrThrow({ where: { enrollment_id: rivalEnrollmentId } }),
    ).toMatchObject({ is_unlocked: false, is_approved: false });
  });
  it('merges legacy duplicate perks without losing usage history or the once-only state', async () => {
    const first = await setup('extortion', false);
    await prisma.$executeRawUnsafe('DROP INDEX student_perks_enrollment_id_perk_id_key');
    const second = await prisma.student_perks.create({
      data: {
        enrollment_id: first.enrollment_id,
        perk_id: first.perk_id,
        is_used: true,
      },
    });
    for (const id of [first.id, second.id]) {
      await prisma.perk_usage.create({
        data: {
          student_perk_id: id,
          enrollment_id: first.enrollment_id,
          used_at: new Date(),
          result_data: { active: false },
        },
      });
    }
    execFileSync(
      process.execPath,
      [
        require.resolve('prisma/build/index.js'),
        'db',
        'execute',
        '--file',
        resolve('prisma/migrations/20261005000000_unique_student_perk/migration.sql'),
        '--schema',
        resolve('prisma/schema.prisma'),
      ],
      {
        env: { ...process.env, DATABASE_URL: url!, DIRECT_URL: url! },
        stdio: 'pipe',
      },
    );
    expect(await prisma.student_perks.count()).toBe(1);
    expect((await prisma.student_perks.findFirstOrThrow()).is_used).toBe(true);
    expect((await prisma.student_perks.findFirstOrThrow()).is_unlocked).toBe(true);
    expect(await prisma.perk_usage.count({ where: { student_perk_id: second.id } })).toBe(2);
    await expect(
      prisma.student_perks.create({
        data: { enrollment_id: first.enrollment_id, perk_id: first.perk_id },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  }, 15000);
});
