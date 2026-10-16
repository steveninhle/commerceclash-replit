import { InternalServerErrorException } from '@nestjs/common';
import { Blueprint } from './Blueprint';
import { Masterpiece } from './Masterpiece';
import { context, fixture, skill, setupPerkTests } from './perk-test.helpers';
import { UPCOMING_SCENARIO_TYPE } from '../utils/types/types';

setupPerkTests();

describe('Architect perks', () => {
  it.each([Masterpiece])(
    '%p adds one unallocated point and records repeatable usage',
    async (Effect) => {
      const { db, prisma } = fixture('masterpiece');
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
  it('Blueprint strengthens only the strongest permanent pillar and consumes one-time usage', async () => {
    const { db, prisma } = fixture('blueprint', false);
    db.student_attributes.findMany.mockResolvedValue([skill('weak', 2), skill('strong', 6)]);
    expect(await new Blueprint(prisma).apply(context())).toMatchObject({
      success: true,
      data: { pillar: 'strong', valueBefore: 6, valueAfter: 7 },
    });
    expect(db.student_attributes.update).toHaveBeenCalledWith({
      where: { id: 'strong' },
      data: { value: { increment: 1 } },
    });
    expect(db.student_perks.update).toHaveBeenCalledWith({
      where: { id: 'perk' },
      data: { is_used: true, is_approved: false, perk_status: null },
    });
  });
  it.each([[[]], [[skill('strong', 8), skill('weak', 2)]]])(
    'Blueprint leaves unavailable pillars and usage untouched',
    async (skills) => {
      const { db, prisma } = fixture('blueprint');
      db.student_attributes.findMany.mockResolvedValue(skills);
      expect(await new Blueprint(prisma).apply(context())).toMatchObject({ success: false });
      expect(db.student_attributes.update).not.toHaveBeenCalled();
      expect(db.student_perks.update).not.toHaveBeenCalled();
    },
  );
  it.each([
    ['blueprint', Blueprint],
    ['masterpiece', Masterpiece],
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
