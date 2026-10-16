import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';

/**
 * Corporate Empire Perk (Tycoon - Ultra)
 *
 * Effect: Instantly adds +4 skill points to student's available pool.
 *
 * Success Criteria:
 * - When activated, teacher sees request → presses confirm (requires approval)
 * - System instantly adds +4 skill points to student's pool
 * - Points must show in the skill tree UI
 * - Perk becomes permanently "used" (one-time use only)
 *
 * Example:
 * - Before activation → Student has 3 available skill points
 * - After → Student has 7
 */
export class CorporateEmpire extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(CorporateEmpire.name);

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      // Get current points before update
      const currentEnrollment = await this.prisma.enrolled_students.findUnique({
        where: { id: ctx.student.enrollmentId },
        select: { available_points: true },
      });

      const pointsBefore = currentEnrollment?.available_points ?? 0;

      // Add +4 skill points
      const updated = await this.prisma.enrolled_students.update({
        where: { id: ctx.student.enrollmentId },
        data: { available_points: { increment: 4 } },
      });

      const pointsAfter = updated.available_points ?? 0;

      // Mark perk as permanently used (one-time use)
      await this.markPerkAsUsed(ctx.perk.id);

      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        addedPoints: 4,
        pointsBefore,
        pointsAfter,
      });

      this.logger.log(
        `Corporate Empire activated for ${ctx.student.name}: ${pointsBefore} → ${pointsAfter} skill points (+4)`,
      );

      return {
        success: true,
        message: `Corporate Empire activated! You gained +4 skill points (${pointsBefore} → ${pointsAfter}).`,
        data: {
          available_points: pointsAfter,
          pointsAdded: 4,
          pointsBefore,
          pointsAfter,
          studentId: ctx.student.id,
          studentName: ctx.student.name,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error applying perk: ${message}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply perk Corporate Empire',
        error: message,
      });
    }
  }
}
