import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Spotlight } from './Spotlight';
import { StarPower } from './StarPower';
import { context, fixture, setupPerkTests } from './perk-test.helpers';
import { UPCOMING_SCENARIO_TYPE } from '../utils/types/types';

setupPerkTests();

describe('Showman perks', () => {
  it.each([Spotlight])(
    '%p adds one unallocated point and records repeatable usage',
    async (Effect) => {
      const { db, prisma } = fixture();
      const result = await new Effect(prisma).apply(context({ maxedSkillName: 'Marketing' }));
      expect(result).toMatchObject({
        success: true,
        data: { pointsGained: 1, pointsBefore: 2, pointsAfter: 3 },
      });
      expect(db.enrolled_students.update).toHaveBeenCalledWith({
        where: { id: 'own' },
        data: { available_points: { increment: 1 } },
      });
      expect(db.student_attributes.update).not.toHaveBeenCalled();
      expect(db.student_perks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            is_used: true,
            perk_status: null,
            next_available_at: expect.any(Date),
          }),
        }),
      );
      expect(db.perk_usage.create).toHaveBeenCalledTimes(1);
    },
  );
  it.each([['spotlight', Spotlight]] as const)(
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
  it.each([StarPower])('%p selection does not mutate skills, balances or usage', async (Effect) => {
    const { db, prisma, classGateway } = fixture();
    expect(await new Effect(classGateway, prisma).apply(context())).toMatchObject({
      data: { pendingCompletion: true, requiresSelection: true },
    });
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.student_perks.update).not.toHaveBeenCalled();
  });
  it.each([0, 3])(
    'Star Power caps theft at the redirected target balance (%i)',
    async (market_share) => {
      const { db, prisma, classGateway, gateway } = fixture();
      gateway.checkAndOfferFanTheFlames.mockResolvedValue({
        finalTargetEnrollmentId: 'redirected',
        wasRedirected: true,
      });
      db.enrolled_students.findUnique.mockResolvedValue({
        market_share,
        student_id: 'redirected-student',
        users: { name: 'Redirected' },
      });
      expect(
        await new StarPower(classGateway, prisma).apply(context({ targetStudentId: 'rival' })),
      ).toMatchObject({
        data: { rival: 'redirected-student', msStolen: Math.min(1, market_share) },
      });
      expect(db.enrolled_students.update).toHaveBeenCalledWith({
        where: { id: 'redirected' },
        data: { market_share: Math.max(0, market_share - 1) },
      });
    },
  );
  it('Star Power rejects a rival outside the class', async () => {
    const { db, prisma, classGateway } = fixture();
    await expect(
      new StarPower(classGateway, prisma).apply(context({ targetStudentId: 'outsider' })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
