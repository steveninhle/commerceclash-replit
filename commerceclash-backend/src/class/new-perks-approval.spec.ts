import { PrismaService } from '@utils/prisma/prisma.service';
import { AppConfigService } from '@utils/config/config.service';
import { ReusableService } from '@utils/common/classes/reusable';
import { ClassService } from './class.service';
import { ClassGateway } from './class.gateway';
import {
  NEW_PERK_KEYS,
  REACTIVE_ONLY_PERK_KEYS,
  waitsForPerkTrigger,
} from '../gamification/utils/reactivePerkKeys';
import { PerkEngine } from '../gamification/PerkEngine';
import { provisionStudentPerk } from '../gamification/utils/provisionStudentPerk';
import { fixture, context, setupPerkTests } from '../gamification/systems/perk-test.helpers';

setupPerkTests();

function approvalFixture(key = 'spotlight') {
  const base = fixture(key);
  const { db, perk } = base;
  const enrollment = {
    enrolledStudent: { id: 'own', archtype_id: 'ceo', level: 5 },
    user: { name: 'Student' },
    class: { instructor_id: 'teacher' },
  };
  const record = { studentPerk: perk, perk: { perk: { key, title: key } } };
  const reusable = {
    checkEnrollment: jest.fn().mockResolvedValue(enrollment),
    checkPerk: jest.fn().mockResolvedValue(record),
  };
  const updateMany = jest.fn().mockResolvedValue({ count: 1 });
  const template = { ...perk.perks, id: 'template' };
  const findTemplate = jest.fn().mockResolvedValue(template);
  const findEnrollment = jest
    .fn()
    .mockResolvedValue({ ...enrollment.enrolledStudent, users: { name: 'Student' } });
  const gateway = { emitPerkApprovalRequest: jest.fn() };
  const prisma = {
    ...db,
    student_perks: { ...db.student_perks, updateMany },
    perks: { findUnique: findTemplate, findUniqueOrThrow: findTemplate },
    enrolled_students: {
      ...db.enrolled_students,
      findFirst: findEnrollment,
      findUnique: jest
        .fn()
        .mockResolvedValue({ ...enrollment.enrolledStudent, is_cancelled: false }),
    },
    renamedclass: { findUnique: jest.fn().mockResolvedValue({ instructor_id: 'teacher' }) },
  };
  prisma.$transaction.mockImplementation((run: (tx: typeof prisma) => unknown) => run(prisma));
  const service = new ClassService(
    { getZakCookieOptions: () => ({}) } as unknown as AppConfigService,
    prisma as unknown as PrismaService,
    gateway as unknown as ClassGateway,
    reusable as unknown as ReusableService,
  );
  return {
    ...base,
    prisma: prisma as unknown as PrismaService,
    mocks: prisma,
    service,
    enrollment,
    record,
    updateMany,
    gateway,
    findEnrollment,
    template,
  };
}

describe('New CEO perk teacher approval', () => {
  it.each(NEW_PERK_KEYS)('%s requires a student request before approval', async (key) => {
    const { service, perk, updateMany } = approvalFixture(key);
    perk.perk_status = 'denied';
    const execute = jest.spyOn(PerkEngine, 'execute');
    await expect(service.decideNewPerk('class', 'student', 'perk', true)).rejects.toThrow(
      'pending',
    );
    expect(updateMany).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
  it.each(NEW_PERK_KEYS)('%s is denied without any effect', async (key) => {
    const { service, perk, updateMany } = approvalFixture(key);
    perk.perk_status = 'pending';
    perk.is_approved = false;
    const execute = jest.spyOn(PerkEngine, 'execute');
    expect(await service.decideNewPerk('class', 'student', 'perk', false)).toMatchObject({
      success: true,
      data: { perk_status: 'denied' },
    });
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { is_approved: false, perk_status: 'denied' } }),
    );
    expect(execute).not.toHaveBeenCalled();
  });
  it.each(NEW_PERK_KEYS.filter(waitsForPerkTrigger))(
    '%s approval enables it without firing the effect',
    async (key) => {
      const { service, perk } = approvalFixture(key);
      perk.perk_status = 'pending';
      perk.is_approved = false;
      const execute = jest.spyOn(PerkEngine, 'execute');
      expect(await service.decideNewPerk('class', 'student', 'perk', true)).toMatchObject({
        success: true,
        data: { waitingForTrigger: true, pendingCompletion: true },
      });
      expect(execute).not.toHaveBeenCalled();
    },
  );
  it.each(['afterburner', 'blueprint', 'danger_zone'])(
    '%s runs the immediate/selection flow after approval',
    async (key) => {
      const { service, perk } = approvalFixture(key);
      perk.perk_status = 'pending';
      perk.is_approved = false;
      const activation = jest
        .spyOn(service, 'activatePerkAfterApproval')
        .mockResolvedValue({ success: true, message: 'effect' });
      await service.decideNewPerk('class', 'student', 'perk', true);
      expect(activation).toHaveBeenCalledWith('class', 'student', 'perk');
    },
  );
  it.each(NEW_PERK_KEYS)(
    '%s cannot run before approval through the activation service',
    async (key) => {
      const { service, perk } = approvalFixture(key);
      perk.is_approved = false;
      const execute = jest.spyOn(PerkEngine, 'execute');
      await expect(service.activatePerkAfterApproval('class', 'student', 'perk')).rejects.toThrow();
      expect(execute).not.toHaveBeenCalled();
    },
  );
  it.each(['star_power', 'extortion'])(
    '%s cannot select a target before its approved gameplay event',
    async (key) => {
      const { service } = approvalFixture(key);
      const execute = jest.spyOn(PerkEngine, 'execute');
      await expect(
        service.activatePerkAfterApproval('class', 'student', 'perk', { targetStudentId: 'rival' }),
      ).rejects.toThrow();
      expect(execute).not.toHaveBeenCalled();
    },
  );
  it.each([
    ['core', 2, false],
    ['core', 3, true],
    ['ultra', 4, false],
    ['ultra', 5, true],
  ] as const)('checks %s approval at level %i', async (type, level, allowed) => {
    const { service, perk, enrollment } = approvalFixture();
    perk.perk_status = 'pending';
    perk.is_approved = false;
    perk.perks.perk_types.type = type;
    enrollment.enrolledStudent.level = level;
    const decision = service.decideNewPerk('class', 'student', 'perk', true);
    if (allowed) await expect(decision).resolves.toMatchObject({ success: true });
    else await expect(decision).rejects.toThrow();
  });
  it('rejects approval below the level threshold even if an unlocked flag was forced', async () => {
    const { service, perk, enrollment } = approvalFixture();
    perk.perk_status = 'pending';
    perk.is_approved = false;
    enrollment.enrolledStudent.level = 2;
    await expect(service.decideNewPerk('class', 'student', 'perk', true)).rejects.toThrow();
  });
  it('does not run an effect when a competing decision already consumed the request', async () => {
    const { service, perk, updateMany } = approvalFixture('blueprint');
    perk.perk_status = 'pending';
    perk.is_approved = false;
    updateMany.mockResolvedValue({ count: 0 });
    const execute = jest.spyOn(PerkEngine, 'execute');
    await expect(service.decideNewPerk('class', 'student', 'perk', true)).rejects.toThrow(
      'already',
    );
    expect(execute).not.toHaveBeenCalled();
  });
  it('lets a reactive perk request approval and notifies the teacher without firing', async () => {
    const { service, perk, gateway, db } = approvalFixture();
    perk.perk_status = 'denied';
    perk.is_approved = false;
    const execute = jest.spyOn(PerkEngine, 'execute');
    await service.activateStudentPerk('class', 'student', 'perk');
    expect(db.student_perks.update).toHaveBeenCalledWith({
      where: { id: 'perk' },
      data: { perk_status: 'pending', is_approved: false },
    });
    expect(gateway.emitPerkApprovalRequest).toHaveBeenCalledTimes(1);
    expect(execute).not.toHaveBeenCalled();
  });
});

describe('Standalone page gameplay simulation', () => {
  it.each(REACTIVE_ONLY_PERK_KEYS)(
    '%s still requires teacher approval in the test lab',
    async (key) => {
      const { service, perk } = approvalFixture(key);
      perk.is_approved = false;
      const execute = jest.spyOn(PerkEngine, 'execute');
      expect(
        await service.triggerApprovedPerkForTest('class', 'student', key, 'market'),
      ).toMatchObject({ success: false });
      expect(execute).not.toHaveBeenCalled();
    },
  );
  it.each(['afterburner', 'blueprint', 'danger_zone', 'fan_the_flames', 'unknown'])(
    'rejects an unsupported simulated trigger %s',
    async (key) => {
      const { service } = approvalFixture();
      await expect(service.triggerApprovedPerkForTest('class', 'student', key)).rejects.toThrow(
        'no simulated',
      );
    },
  );
  it('rejects invalid Prophecy predictions before reserving approval', async () => {
    const { service, db } = approvalFixture('prophecy');
    await expect(
      service.triggerApprovedPerkForTest('class', 'student', 'prophecy', 'unknown'),
    ).rejects.toThrow('valid scenario');
    expect(db.student_perks.update).not.toHaveBeenCalled();
  });
});

describe('Approved event reservations', () => {
  it.each([false, true])('cannot self-approve an event (previously used: %s)', async (is_used) => {
    const { prisma, perk, db } = approvalFixture();
    Object.assign(perk, { is_approved: false, is_used, next_available_at: new Date(0) });
    expect(await provisionStudentPerk(prisma, 'own', 'spotlight')).toMatchObject({
      status: 'unavailable',
    });
    expect(db.student_perks.update).not.toHaveBeenCalled();
  });
  it('reserves an unlocked teacher-approved perk for its event', async () => {
    const { prisma, db } = approvalFixture();
    expect(await provisionStudentPerk(prisma, 'own', 'spotlight')).toMatchObject({
      status: 'ready',
    });
    expect(db.student_perks.update).toHaveBeenCalledWith({
      where: { id: 'perk' },
      data: { perk_status: 'pending' },
    });
  });
  it('does not manufacture an approved instance for an event', async () => {
    const { prisma, db } = approvalFixture();
    db.student_perks.findFirst.mockResolvedValue(null);
    expect(await provisionStudentPerk(prisma, 'own', 'spotlight')).toMatchObject({
      status: 'archetype_mismatch',
    });
    expect(db.student_perks.update).not.toHaveBeenCalled();
  });
  it('blocks another event while target selection is unfinished', async () => {
    const { prisma, db } = approvalFixture('star_power');
    db.perk_usage.findFirst.mockResolvedValue({ result_data: { pendingCompletion: true } });
    expect(await provisionStudentPerk(prisma, 'own', 'star_power')).toMatchObject({
      status: 'unavailable',
    });
  });
});

describe('Effect engine approval boundary', () => {
  it('cannot bypass approval through a partial registry alias', async () => {
    const { prisma, perk } = approvalFixture('prophecy');
    perk.is_approved = false;
    await expect(PerkEngine.execute('oracle_prophecy', context(), { prisma })).rejects.toThrow(
      'teacher-approved',
    );
  });
  it.each(NEW_PERK_KEYS)('%s cannot bypass teacher approval through the engine', async (key) => {
    const { prisma, perk, db } = approvalFixture(key);
    perk.is_approved = false;
    await expect(PerkEngine.execute(key, context(), { prisma })).rejects.toThrow(
      'teacher-approved',
    );
    expect(db.student_attributes.update).not.toHaveBeenCalled();
    expect(db.enrolled_students.update).not.toHaveBeenCalled();
  });
});
