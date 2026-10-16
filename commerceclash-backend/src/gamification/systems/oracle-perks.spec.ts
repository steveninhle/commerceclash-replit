import { InternalServerErrorException } from '@nestjs/common';
import { Prophecy } from './Prophecy';
import { CrystalBall } from './CrystalBall';
import { context, fixture, setupPerkTests } from './perk-test.helpers';
import { UPCOMING_SCENARIO_TYPE } from '../utils/types/types';

setupPerkTests();

describe('Oracle perks', () => {
  it.each([CrystalBall])(
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
  it.each([undefined, 'crisis', UPCOMING_SCENARIO_TYPE])(
    'Prophecy resolves prediction %s',
    async (predictedType) => {
      const { db, prisma } = fixture();
      const result = await new Prophecy(prisma).apply(context({ predictedType }));
      expect(result.success).toBe(!!predictedType);
      expect(db.enrolled_students.update).toHaveBeenCalledTimes(
        predictedType === UPCOMING_SCENARIO_TYPE ? 1 : 0,
      );
      expect(db.student_perks.update).toHaveBeenCalledTimes(predictedType ? 1 : 0);
      if (predictedType)
        expect(result).toMatchObject({
          data: { correct: predictedType === UPCOMING_SCENARIO_TYPE },
        });
    },
  );
  it.each([
    ['crystal_ball', CrystalBall],
    ['prophecy', Prophecy],
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
});
