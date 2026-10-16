import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';

/**
 * Blueprint Perk (Tycoon)
 *
 * Effect: Adds +1 skill point directly to your strongest pillar (the skill
 * attribute with your highest current value). Unlike Corporate Empire or
 * Spotlight, the point goes straight into that specific skill rather than
 * the unallocated pool. Nothing crazy here.
 *
 * Success Criteria:
 * - Finds the student's own skill attribute with the highest current value
 * - Adds +1 to it, respecting the game's per-skill max of 8
 * - If the strongest pillar is already maxed out, nothing is added and the
 *   perk reports why instead of silently doing nothing
 * - One-time use
 *
 * Example:
 * - Skills: Marketing 5, Finance 3, Operations 2 -> Marketing becomes 6
 */
export class Blueprint extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(Blueprint.name);
  private static readonly POINTS_GAINED = 1;
  private static readonly MAX_SKILL_VALUE = 8;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      const ownAttributes = await this.prisma.student_attributes.findMany({
        where: { enrollment_id: ctx.student.enrollmentId },
        select: {
          id: true,
          value: true,
          attributes: { select: { name: true } },
        },
      });

      if (ownAttributes.length === 0) {
        return {
          success: false,
          message: 'You have no skills to strengthen yet.',
        };
      }

      const strongest = ownAttributes.reduce((max, attr) => (attr.value > max.value ? attr : max));

      if (strongest.value >= Blueprint.MAX_SKILL_VALUE) {
        return {
          success: false,
          message: `Your strongest pillar ("${strongest.attributes.name}") is already maxed out at ${Blueprint.MAX_SKILL_VALUE}.`,
        };
      }

      const updated = await this.prisma.student_attributes.update({
        where: { id: strongest.id },
        data: { value: { increment: Blueprint.POINTS_GAINED } },
      });

      // One-time use only
      await this.markPerkAsUsed(ctx.perk.id);

      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        pillar: strongest.attributes.name,
        pointsGained: Blueprint.POINTS_GAINED,
        valueBefore: strongest.value,
        valueAfter: updated.value,
      });

      this.logger.log(
        `Blueprint: ${ctx.student.name} strengthened "${strongest.attributes.name}" (${strongest.value} -> ${updated.value})`,
      );

      return {
        success: true,
        message: `Blueprint applied! "${strongest.attributes.name}" grew from ${strongest.value} to ${updated.value}.`,
        data: {
          pillar: strongest.attributes.name,
          pointsGained: Blueprint.POINTS_GAINED,
          valueBefore: strongest.value,
          valueAfter: updated.value,
          studentId: ctx.student.id,
          studentName: ctx.student.name,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error applying perk: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Blueprint perk',
        error: message,
      });
    }
  }
}
