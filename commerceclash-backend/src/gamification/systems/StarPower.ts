import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';
import { ClassGateway } from 'src/class/class.gateway';

/**
 * Star Power Perk
 *
 * Effect: Scoring "Elite" on a task lets you steal 1 Market Share from a
 * rival of your choice, chosen afterward.
 *
 * Success Criteria:
 * - Triggered automatically by the task-grading system when a task is scored
 *   Elite (no manual activation/approval — reactive, not clicked)
 * - Phase 1: no rival chosen yet — nothing is applied, returns the rival list
 *   so the student can pick who to steal from
 * - Phase 2: rival chosen — steal 1 MS from them (capped at their current MS)
 * - Repeatable every time they score Elite on a task
 */
export class StarPower extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(StarPower.name);
  private static readonly MS_TO_STEAL = 1;

  constructor(
    private readonly classGateway: ClassGateway,
    prisma: PrismaService,
  ) {
    super(prisma);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      const targetStudentId = ctx.additionalData?.targetStudentId as string | undefined;

      const rivals = await this.prisma.enrolled_students.findMany({
        where: {
          class_id: ctx.classId,
          NOT: { student_id: ctx.student.id },
          is_cancelled: { not: true },
        },
        select: {
          id: true,
          student_id: true,
          market_share: true,
          users: { select: { name: true } },
          archtypes: { select: { title: true } },
        },
      });

      if (rivals.length === 0) {
        return { success: false, message: 'No rivals found to steal MS from' };
      }

      // ========== PHASE 1: no target yet - show rival list ==========
      if (!targetStudentId) {
        const rivalOptions = rivals.map((r) => ({
          id: r.student_id,
          name: r.users?.name ?? 'Unknown',
          marketShare: r.market_share ?? 0,
          ceo: r.archtypes ? { title: r.archtypes.title } : undefined,
        }));

        this.logger.log(
          `Star Power phase 1: Elite score scored - returning ${rivalOptions.length} rivals for selection`,
        );

        return {
          success: true,
          message: `Elite score! Choose a rival to steal ${StarPower.MS_TO_STEAL} MS from.`,
          data: {
            phase: 1,
            requiresSelection: true,
            pendingCompletion: true,
            msToSteal: StarPower.MS_TO_STEAL,
            rivals: rivalOptions,
          },
        };
      }

      // ========== PHASE 2: steal MS from the chosen rival ==========
      const target = rivals.find((r) => r.student_id === targetStudentId);
      if (!target) {
        throw new BadRequestException({
          success: false,
          message: 'Selected rival not found or is not in this class.',
        });
      }

      const intendedSteal = Math.min(StarPower.MS_TO_STEAL, target.market_share ?? 0);

      // Give the original target a chance to redirect this loss via Fan the Flames
      // before it's actually applied.
      const decision = await this.classGateway.checkAndOfferFanTheFlames(
        ctx.classId,
        target.student_id,
        target.id,
        intendedSteal,
        'Star Power',
        ctx.student.name ?? 'A rival',
      );

      const finalTarget = await this.prisma.enrolled_students.findUnique({
        where: { id: decision.finalTargetEnrollmentId },
        select: { market_share: true, student_id: true, users: { select: { name: true } } },
      });
      const currentTargetMS = finalTarget?.market_share ?? 0;
      const actualStolen = Math.min(StarPower.MS_TO_STEAL, currentTargetMS);
      const newTargetMS = currentTargetMS - actualStolen;

      await this.prisma.$transaction(async (tx) => {
        await tx.enrolled_students.update({
          where: { id: decision.finalTargetEnrollmentId },
          data: { market_share: newTargetMS },
        });

        await tx.enrolled_students.update({
          where: { id: ctx.student.enrollmentId },
          data: { market_share: { increment: actualStolen } },
        });
      });

      this.logger.log(
        `Star Power complete: ${ctx.student.name} stole ${actualStolen} MS from ${finalTarget?.users?.name}${decision.wasRedirected ? ' (redirected by Fan the Flames)' : ''}`,
      );

      // Repeatable — every Elite score can trigger this again
      await this.markPerkAsUsed(ctx.perk.id);

      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        trigger: 'elite_task_score',
        targetRival: finalTarget?.student_id,
        targetName: finalTarget?.users?.name,
        msStolen: actualStolen,
        targetNewMS: newTargetMS,
        wasRedirected: decision.wasRedirected,
      });

      return {
        success: true,
        message: `Star Power! You stole ${actualStolen} MS from ${finalTarget?.users?.name ?? 'your rival'}.`,
        data: {
          rival: finalTarget?.student_id,
          rivalName: finalTarget?.users?.name,
          msStolen: actualStolen,
          rivalNewMS: newTargetMS,
          affectedStudentIds: [finalTarget?.student_id].filter((id): id is string => !!id),
        },
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error applying perk: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Star Power perk',
        error: message,
      });
    }
  }
}
