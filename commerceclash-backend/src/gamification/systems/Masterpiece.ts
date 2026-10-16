import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';

/**
 * Masterpiece Perk (Tycoon)
 *
 * Effect: The moment any one of your pillars (skill attributes) reaches its
 * max value, automatically gain +1 skill point added to your pool.
 *
 * Unlike the other reactive perks (Spotlight/Star Power/Prophecy/Crystal
 * Ball), this one reacts to a real, already-implemented event: a skill
 * actually being maxed out via the normal skill-spending flow
 * (SkillsService.updateSkill) — no test button/hardcoded trigger needed.
 *
 * Success Criteria:
 * - Triggered automatically the instant a skill first reaches max — no
 *   manual activation/approval
 * - The point is added to available_points (the free pool), not the maxed
 *   skill itself
 * - Repeatable — maxing out a different pillar later triggers it again
 */
export class Masterpiece extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(Masterpiece.name);
  private static readonly POINTS_GAINED = 1;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      const maxedSkillName =
        (ctx.additionalData?.maxedSkillName as string | undefined) ?? 'a skill';

      const current = await this.prisma.enrolled_students.findUnique({
        where: { id: ctx.student.enrollmentId },
        select: { available_points: true },
      });
      const pointsBefore = current?.available_points ?? 0;

      const updated = await this.prisma.enrolled_students.update({
        where: { id: ctx.student.enrollmentId },
        data: { available_points: { increment: Masterpiece.POINTS_GAINED } },
      });
      const pointsAfter = updated.available_points ?? 0;

      // Repeatable — maxing another pillar later triggers this again.
      await this.markPerkAsUsed(ctx.perk.id);

      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        trigger: 'pillar_maxed',
        maxedSkillName,
        pointsGained: Masterpiece.POINTS_GAINED,
        pointsBefore,
        pointsAfter,
      });

      this.logger.log(
        `Masterpiece: ${ctx.student.name ?? 'Student'} maxed out "${maxedSkillName}" -> +${Masterpiece.POINTS_GAINED} skill point (${pointsBefore} -> ${pointsAfter})`,
      );

      return {
        success: true,
        message: `Masterpiece! You maxed out "${maxedSkillName}" and earned +${Masterpiece.POINTS_GAINED} skill point (${pointsBefore} → ${pointsAfter}).`,
        data: {
          maxedSkillName,
          available_points: pointsAfter,
          pointsGained: Masterpiece.POINTS_GAINED,
          pointsBefore,
          pointsAfter,
          studentId: ctx.student.id,
          studentName: ctx.student.name,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error applying perk: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Masterpiece perk',
        error: message,
      });
    }
  }
}
