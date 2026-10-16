import { InternalServerErrorException } from '@nestjs/common';
import { Rebirth } from './Rebirth';
import { FanTheFlames } from './FanTheFlames';
import { context, fixture, setupPerkTests } from './perk-test.helpers';
import { UPCOMING_SCENARIO_TYPE } from '../utils/types/types';

setupPerkTests();

describe('Phoenix perks', () => {
  it('Rebirth resets the shifting window to two points without changing permanent skills', async () => {
    const { db, prisma } = fixture();
    expect(await new Rebirth(prisma).apply(context())).toMatchObject({
      data: { shiftingEnabled: true, shiftingPoints: 2 },
    });
    expect(db.enrolled_students.update).toHaveBeenCalledWith({
      where: { id: 'own' },
      data: { is_shifting: true, shifting_points: 2 },
    });
    expect(db.student_attributes.update).not.toHaveBeenCalled();
  });
  it.each([['rebirth', Rebirth]] as const)(
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
  it.each([
    [false, true, null, true],
    [true, false, new Date(0), false],
    [true, true, new Date(0), true],
    [true, true, new Date('2099-01-01'), false],
    [true, true, null, false],
  ])(
    'checks usage %s, repeatability %s and cooldown %s',
    async (is_used, is_repeatable, next_available_at, available) => {
      const { db, prisma, perk } = fixture();
      db.student_perks.findFirst.mockResolvedValue({
        ...perk,
        is_used,
        next_available_at,
        perks: { ...perk.perks, is_repeatable },
      });
      expect(await FanTheFlames.findAvailable(prisma, 'own')).toEqual(
        available ? { studentPerkId: 'perk' } : null,
      );
    },
  );
  it('does not offer a missing perk', async () => {
    const { db, prisma } = fixture();
    db.student_perks.findFirst.mockResolvedValue(null);
    expect(await FanTheFlames.findAvailable(prisma, 'own')).toBeNull();
  });
  it('consumes a redirect with a two minute cooldown', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-05T00:00:00Z'));
    const { db, prisma } = fixture();
    await FanTheFlames.markUsedAfterRedirect(prisma, 'perk');
    expect(db.student_perks.update).toHaveBeenCalledWith({
      where: { id: 'perk' },
      data: {
        is_used: true,
        is_approved: false,
        perk_status: null,
        last_used_at: new Date(),
        next_available_at: new Date(Date.now() + 120000),
      },
    });
  });
  it('manual activation reports guardian mode without consuming a redirect', async () => {
    const { db, prisma, classGateway } = fixture();
    expect(await new FanTheFlames(classGateway, prisma).apply(context())).toMatchObject({
      data: { guardianMode: true },
    });
    expect(db.student_perks.update).not.toHaveBeenCalled();
    expect(db.enrolled_students.update).not.toHaveBeenCalled();
  });
});
