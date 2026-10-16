import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InsiderTrading } from './InsiderTrading';
import { Extortion } from './Extortion';
import { context, fixture, skill, setupPerkTests } from './perk-test.helpers';
import { UPCOMING_SCENARIO_TYPE } from '../utils/types/types';

setupPerkTests();

describe('Shadow perks', () => {
  it.each([InsiderTrading])(
    '%p reveals the shared upcoming type without awarding points',
    async (Effect) => {
      const { db, prisma } = fixture('insider_trading');
      expect(await new Effect(prisma).apply(context())).toMatchObject({
        success: true,
        data: { scenarioType: UPCOMING_SCENARIO_TYPE },
      });
      expect(db.enrolled_students.update).not.toHaveBeenCalled();
      expect(db.perk_usage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            result_data: expect.objectContaining({ revealedType: UPCOMING_SCENARIO_TYPE }),
          }),
        }),
      );
    },
  );
  it.each([
    ['insider_trading', InsiderTrading],
    ['extortion', Extortion],
  ] as const)('%s reports database failures', async (perkKey, Effect) => {
    const { db, prisma } = fixture(perkKey);
    for (const model of [db.student_attributes, db.enrolled_students, db.student_perks]) {
      for (const method of Object.values(model))
        method.mockRejectedValue(new Error('database unavailable'));
    }
    await expect(
      new Effect(prisma).apply(context({ predictedType: UPCOMING_SCENARIO_TYPE })),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
  it('Extortion offers only rivals with two effective points and does not consume usage during selection', async () => {
    const { db, prisma, rival } = fixture('extortion');
    db.enrolled_students.findMany.mockResolvedValue([
      rival,
      { ...rival, student_id: 'poor', student_attributes: [skill('poor-skill', 1)] },
    ]);
    expect(await new Extortion(prisma).apply(context())).toMatchObject({
      data: { pendingCompletion: true, rivals: [{ id: 'rival', skillPoints: 3 }] },
    });
    expect(db.student_perks.update).not.toHaveBeenCalled();
  });
  it('Extortion transfers exactly two temporary points and records both affected students', async () => {
    const { db, prisma } = fixture('extortion');
    expect(await new Extortion(prisma).apply(context({ targetStudentId: 'rival' }))).toMatchObject({
      success: true,
      data: {
        pointsStolen: 2,
        deductions: [{ skillId: 'rival-skill', amount: 2 }],
        increments: [{ skillId: 'strong', amount: 2 }],
        affectedStudentIds: ['student', 'rival'],
      },
    });
    expect(db.student_attributes.update).not.toHaveBeenCalled();
    expect(db.perk_usage.create).toHaveBeenCalledTimes(1);
  });
  it.each(['outside-class', 'rival'])(
    'Extortion rejects invalid target or full recipient without recording usage (%s)',
    async (targetStudentId) => {
      const { db, prisma } = fixture('extortion');
      db.student_attributes.findMany.mockResolvedValue([skill('strong', 8)]);
      await expect(
        new Extortion(prisma).apply(context({ targetStudentId })),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(db.perk_usage.create).not.toHaveBeenCalled();
    },
  );
  it('Extortion rejects target completion before scenario approval', async () => {
    const { db, prisma, perk } = fixture('extortion');
    perk.perk_status = 'pending';
    await expect(
      new Extortion(prisma).apply(context({ targetStudentId: 'rival' })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.perk_usage.create).not.toHaveBeenCalled();
  });
});
