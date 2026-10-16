import { PrismaService } from '@utils/prisma/prisma.service';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { InternalServerErrorException, Logger } from '@nestjs/common';

/**
 * Rallying Cry Perk (Commander - Core)
 *
 * Effect: Temporarily unlocks skill tree, allowing student to shift up to 2 points between their own skills.
 *
 * Success Criteria:
 * - Activatable after scenario reveal
 * - Unlocks skill tree temporarily
 * - Student may shift up to 2 points between trees
 * - Tree locks again after confirmation
 *
 * Example:
 * - Before: Strategy 4, Influence 2
 * - They move 2: Strategy –2 → Influence +2
 * - After: Strategy 2, Influence 4
 */
export class RallyingCry extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(RallyingCry.name);

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      // Enable shifting mode with 2 points allowed
      const updated = await this.prisma.enrolled_students.update({
        where: { id: ctx.student.enrollmentId },
        data: {
          is_shifting: true,
          shifting_points: 2,
          skill_unlocked: true, // Temporarily unlock skills for shifting
        },
      });

      this.logger.log(
        `Rallying Cry activated for ${ctx.student.name}: shifting mode enabled with 2 points`,
      );

      await this.markPerkAsUsed(ctx.perk.id);
      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        shiftingPoints: 2,
        enrollmentId: updated.id,
      });

      return {
        success: true,
        message:
          'Rallying Cry activated! Go to your Skills page to shift up to 2 points between your skill trees.',
        data: {
          shiftingEnabled: true,
          shiftingPoints: 2,
          actionRequired: 'skills_page',
          studentId: ctx.student.id,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error applying perk: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Rallying Cry perk',
        error: message,
      });
    }
  }
}
