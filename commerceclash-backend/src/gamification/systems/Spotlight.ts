import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';

/**
 * Spotlight Perk
 *
 * Effect: Scoring "Elite" on a task grants +1 skill point to spend freely.
 *
 * Success Criteria:
 * - Triggered automatically by the task-grading system when a task is scored Elite
 *   (no manual activation/approval — this is a reactive perk, not a clicked one)
 * - The point is added to the student's available_points pool so they can place
 *   it on whichever skill they choose, rather than being auto-allocated
 * - Repeatable every time they score Elite on a task
 */
export class Spotlight extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(Spotlight.name);
  private static readonly POINTS_GAINED = 1;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      const current = await this.prisma.enrolled_students.findUnique({
        where: { id: ctx.student.enrollmentId },
        select: { available_points: true },
      });
      const pointsBefore = current?.available_points ?? 0;

      const updated = await this.prisma.enrolled_students.update({
        where: { id: ctx.student.enrollmentId },
        data: { available_points: { increment: Spotlight.POINTS_GAINED } },
      });
      const pointsAfter = updated.available_points ?? 0;

      // Repeatable — every Elite score re-triggers this (subject to the standard cooldown)
      await this.markPerkAsUsed(ctx.perk.id);

      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        trigger: 'elite_task_score',
        pointsGained: Spotlight.POINTS_GAINED,
        pointsBefore,
        pointsAfter,
      });

      this.logger.log(
        `Spotlight triggered for ${ctx.student.name}: Elite score -> +${Spotlight.POINTS_GAINED} skill point (${pointsBefore} -> ${pointsAfter})`,
      );

      return {
        success: true,
        message: `Spotlight! Elite score earned you +${Spotlight.POINTS_GAINED} skill point (${pointsBefore} → ${pointsAfter}). Spend it on any skill.`,
        data: {
          available_points: pointsAfter,
          pointsGained: Spotlight.POINTS_GAINED,
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
        message: 'Failed to apply Spotlight perk',
        error: message,
      });
    }
  }
}
