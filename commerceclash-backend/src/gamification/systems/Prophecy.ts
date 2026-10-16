import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';
import { ScenarioType, UPCOMING_SCENARIO_TYPE } from '../utils/types/types';

/**
 * Prophecy Perk
 *
 * Effect: Predict the next scenario's type before it's revealed. If the
 * prediction is correct, automatically gain +1 skill point.
 *
 * There is no scenario system yet, so the "actual" next scenario type is the
 * shared UPCOMING_SCENARIO_TYPE placeholder (see utils/types/types.ts) until
 * the real scenario-drawing logic exists and can supply the real type instead.
 *
 * Success Criteria:
 * - Triggered automatically by a prediction popup at the start of the
 *   scenario phase (no manual activation/approval — reactive, not clicked)
 * - Correct prediction adds +1 skill point to available_points
 * - Repeatable every scenario phase, win or lose
 */
export class Prophecy extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(Prophecy.name);
  private static readonly POINTS_GAINED = 1;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      const predictedType = ctx.additionalData?.predictedType as ScenarioType | undefined;

      if (!predictedType) {
        return {
          success: false,
          message: 'No prediction submitted.',
        };
      }

      const isCorrect = predictedType === UPCOMING_SCENARIO_TYPE;

      // Repeatable — resolves (and resets, via markPerkAsUsed) every scenario phase, win or lose.
      await this.markPerkAsUsed(ctx.perk.id);

      if (!isCorrect) {
        await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
          trigger: 'scenario_prediction',
          predictedType,
          actualType: UPCOMING_SCENARIO_TYPE,
          correct: false,
        });

        this.logger.log(
          `Prophecy: ${ctx.student.name} predicted "${predictedType}", actual was "${UPCOMING_SCENARIO_TYPE}" — no points.`,
        );

        return {
          success: true,
          message: `Wrong guess! You predicted "${predictedType}" but the scenario was "${UPCOMING_SCENARIO_TYPE}". No points this time.`,
          data: {
            correct: false,
            predictedType,
            actualType: UPCOMING_SCENARIO_TYPE,
          },
        };
      }

      const current = await this.prisma.enrolled_students.findUnique({
        where: { id: ctx.student.enrollmentId },
        select: { available_points: true },
      });
      const pointsBefore = current?.available_points ?? 0;

      const updated = await this.prisma.enrolled_students.update({
        where: { id: ctx.student.enrollmentId },
        data: { available_points: { increment: Prophecy.POINTS_GAINED } },
      });
      const pointsAfter = updated.available_points ?? 0;

      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        trigger: 'scenario_prediction',
        predictedType,
        actualType: UPCOMING_SCENARIO_TYPE,
        correct: true,
        pointsGained: Prophecy.POINTS_GAINED,
        pointsBefore,
        pointsAfter,
      });

      this.logger.log(
        `Prophecy: ${ctx.student.name} correctly predicted "${predictedType}" -> +${Prophecy.POINTS_GAINED} skill point (${pointsBefore} -> ${pointsAfter})`,
      );

      return {
        success: true,
        message: `Prophecy fulfilled! You correctly predicted "${predictedType}" and earned +${Prophecy.POINTS_GAINED} skill point (${pointsBefore} → ${pointsAfter}).`,
        data: {
          correct: true,
          predictedType,
          actualType: UPCOMING_SCENARIO_TYPE,
          available_points: pointsAfter,
          pointsGained: Prophecy.POINTS_GAINED,
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
        message: 'Failed to apply Prophecy perk',
        error: message,
      });
    }
  }
}
