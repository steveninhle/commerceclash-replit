import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Afterburner } from './Afterburner';
import { DangerZone } from './DangerZone';
import { context, fixture, skill, setupPerkTests } from './perk-test.helpers';
import { UPCOMING_SCENARIO_TYPE } from '../utils/types/types';

setupPerkTests();

describe('Maverick perks', () => {
  it.each([['afterburner', Afterburner]] as const)(
    '%s reports database failures',
    async (perkKey, Effect) => {
      const { db, prisma } = fixture(perkKey);
      for (const model of [db.student_attributes, db.enrolled_students, db.student_perks]) {
        for (const method of Object.values(model))
          method.mockRejectedValue(new Error('database unavailable'));
      }
      await expect(
        new Effect(prisma).apply(context({ predictedType: UPCOMING_SCENARIO_TYPE })),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    },
  );
  it('Afterburner splits two points around the cap without editing permanent values', async () => {
    const { db, prisma } = fixture();
    db.student_attributes.findMany.mockResolvedValue([skill('strong', 7), skill('weak', 2)]);
    expect(await new Afterburner(prisma).apply(context())).toMatchObject({
      success: true,
      data: {
        increments: [
          { skillId: 'strong', amount: 1 },
          { skillId: 'weak', amount: 1 },
        ],
      },
    });
    expect(db.student_attributes.update).not.toHaveBeenCalled();
    expect(db.perk_usage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          result_data: expect.objectContaining({ active: true, accounting: 'modifier' }),
        }),
      }),
    );
  });
  it('Afterburner considers active modifiers when checking capacity', async () => {
    const { db, prisma } = fixture();
    db.student_attributes.findMany.mockResolvedValue([skill('strong', 6)]);
    db.perk_usage.findMany.mockResolvedValue([
      {
        result_data: {
          active: true,
          accounting: 'modifier',
          increments: [{ skillId: 'strong', amount: 1 }],
        },
      },
    ]);
    expect(await new Afterburner(prisma).apply(context())).toMatchObject({ success: false });
    expect(db.student_perks.update).not.toHaveBeenCalled();
  });
  it('Afterburner refuses to stack an already active effect', async () => {
    const { db, prisma } = fixture();
    db.perk_usage.findFirst.mockResolvedValue({ result_data: { active: true } });
    await expect(new Afterburner(prisma).apply(context())).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(db.perk_usage.create).not.toHaveBeenCalled();
  });
  it.each([DangerZone])(
    '%p selection does not mutate skills, balances or usage',
    async (Effect) => {
      const { db, prisma, classGateway } = fixture();
      expect(await new Effect(classGateway, prisma).apply(context())).toMatchObject({
        data: { pendingCompletion: true, requiresSelection: true },
      });
      expect(db.$transaction).not.toHaveBeenCalled();
      expect(db.student_perks.update).not.toHaveBeenCalled();
    },
  );
  it.each([[undefined], [[{ skillId: 'strong', amount: 1 }]]])(
    'Danger Zone waits for the full sacrifice',
    async (skillDeductions) => {
      const { db, prisma, classGateway } = fixture();
      expect(
        await new DangerZone(classGateway, prisma).apply(
          context({ targetStudentId: 'rival', skillDeductions }),
        ),
      ).toMatchObject({ data: { pendingCompletion: true } });
      expect(db.$transaction).not.toHaveBeenCalled();
    },
  );
  it.each([
    [[{ skillId: 'foreign', amount: 2 }]],
    [
      [
        { skillId: 'weak', amount: 3 },
        { skillId: 'strong', amount: -1 },
      ],
    ],
    [
      [
        { skillId: 'weak', amount: 1 },
        { skillId: 'weak', amount: 1 },
      ],
    ],
    [
      [
        { skillId: 'strong', amount: 0.5 },
        { skillId: 'weak', amount: 1.5 },
      ],
    ],
  ])('Danger Zone rejects invalid sacrifice %j before any writes', async (skillDeductions) => {
    const { db, prisma, classGateway, gateway } = fixture();
    db.student_attributes.findMany.mockResolvedValue([skill('strong', 6), skill('weak', 1)]);
    await expect(
      new DangerZone(classGateway, prisma).apply(
        context({ targetStudentId: 'rival', skillDeductions }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(gateway.checkAndOfferFanTheFlames).not.toHaveBeenCalled();
  });
  it.each([0, 1, 3])(
    'Danger Zone pays two skill points even when the rival has %i MS',
    async (market_share) => {
      const { db, prisma, classGateway, rival } = fixture('danger_zone', false);
      db.enrolled_students.findUnique.mockResolvedValue({ ...rival, market_share });
      expect(
        await new DangerZone(classGateway, prisma).apply(
          context({
            targetStudentId: 'rival',
            skillDeductions: [{ skillId: 'strong', amount: 2 }],
          }),
        ),
      ).toMatchObject({
        data: {
          pointsRemoved: 2,
          msStolen: Math.min(2, market_share),
          rivalNewMS: Math.max(0, market_share - 2),
        },
      });
      expect(db.student_attributes.update).toHaveBeenCalledWith({
        where: { id: 'strong' },
        data: { value: { decrement: 2 } },
      });
      expect(db.enrolled_students.update).toHaveBeenCalledWith({
        where: { id: 'own' },
        data: { market_share: { increment: Math.min(2, market_share) } },
      });
    },
  );
});
