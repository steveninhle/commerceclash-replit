import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';
import { ClassGateway } from 'src/class/class.gateway';

/**
 * Trendsetter Perk (Diplomat - Ultra)
 *
 * Effect: Automatically applies every class. Diplomat gets +1 MS, picks one rival to lose -1 MS.
 *
 * Success Criteria:
 * - Automatically applies every class (auto-approve, repeatable)
 * - Student gets +1 MS immediately when activated
 * - They pick one rival to lose -1 MS
 * - Happens once per class without teacher approval needed
 *
 * Example:
 * - Diplomat activates Trendsetter → gains +1 MS
 * - Diplomat chooses Alex → Alex gets -1 MS
 *
 * Flow:
 * 1. Phase 1: No target - give +1 MS to diplomat, return rivals for selection
 * 2. Phase 2: Target selected - apply -1 MS to rival, mark perk as used
 */
export class Trendsetter extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(Trendsetter.name);

  constructor(
    private readonly classGateway: ClassGateway,
    prisma: PrismaService,
  ) {
    super(prisma);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      // Get target from additional data if provided (Phase 2)
      const targetStudentId = ctx.additionalData?.targetStudentId as string | undefined;

      // Fetch all rivals
      const rivals = await this.prisma.enrolled_students.findMany({
        where: {
          class_id: ctx.classId,
          student_id: { not: ctx.student.id },
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
        return { success: false, message: 'No rivals found in the class' };
      }

      // ========== PHASE 1: Give +1 MS to diplomat, show rivals ==========
      if (!targetStudentId) {
        // Give +1 MS to the diplomat immediately
        const updatedDiplomat = await this.prisma.enrolled_students.update({
          where: { id: ctx.student.enrollmentId },
          data: { market_share: { increment: 1 } },
        });

        this.logger.log(
          `Trendsetter Phase 1: ${ctx.student.name} gained +1 MS (now ${updatedDiplomat.market_share})`,
        );

        // Return rivals for selection (don't mark as used yet)
        const rivalOptions = rivals.map((r) => ({
          id: r.student_id,
          name: r.users?.name ?? 'Unknown',
          marketShare: r.market_share ?? 0,
          ceo: r.archtypes?.title ? { title: r.archtypes.title } : undefined,
        }));

        return {
          success: true,
          message: `Trendsetter activated! You gained +1 MS. Now choose a rival to lose -1 MS.`,
          data: {
            phase: 1,
            requiresSelection: true,
            pendingCompletion: true,
            diplomatGained: 1,
            newDiplomatMS: updatedDiplomat.market_share,
            rivals: rivalOptions,
          },
        };
      }

      // ========== PHASE 2: Apply -1 MS to selected rival ==========
      const target = rivals.find((r) => r.student_id === targetStudentId);

      if (!target) {
        throw new BadRequestException({
          success: false,
          message: 'Selected rival not found or is not in this class.',
        });
      }

      // Give the original target a chance to redirect this loss via Fan the Flames
      // before it's actually applied.
      const decision = await this.classGateway.checkAndOfferFanTheFlames(
        ctx.classId,
        target.student_id,
        target.id,
        1,
        'Trendsetter',
        ctx.student.name ?? 'A rival',
      );

      const finalTarget = await this.prisma.enrolled_students.findUnique({
        where: { id: decision.finalTargetEnrollmentId },
        select: { market_share: true, student_id: true, users: { select: { name: true } } },
      });

      // Apply -1 MS to whoever ends up taking the loss (but don't go below 0)
      const currentMS = finalTarget?.market_share ?? 0;
      const newMS = Math.max(0, currentMS - 1);
      const actualLoss = currentMS - newMS;

      await this.prisma.enrolled_students.update({
        where: { id: decision.finalTargetEnrollmentId },
        data: { market_share: newMS },
      });

      this.logger.log(
        `Trendsetter Phase 2: ${finalTarget?.users?.name} lost -${actualLoss} MS (${currentMS} → ${newMS})${decision.wasRedirected ? ' (redirected by Fan the Flames)' : ''}`,
      );

      // Mark perk as used (repeatable - once per class)
      await this.markPerkAsUsed(ctx.perk.id);

      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        diplomatGained: 1,
        rivalId: finalTarget?.student_id,
        rivalName: finalTarget?.users?.name,
        rivalLost: actualLoss,
        rivalNewMS: newMS,
        wasRedirected: decision.wasRedirected,
      });

      // Notify via gateway
      this.classGateway.server.to(ctx.classId).emit('trendsetter-applied', {
        success: true,
        message: `${ctx.student.name} used Trendsetter!`,
        data: {
          diplomat: {
            id: ctx.student.id,
            name: ctx.student.name,
          },
          victim: {
            id: finalTarget?.student_id,
            name: finalTarget?.users?.name,
            lostMS: actualLoss,
          },
        },
      });

      return {
        success: true,
        message: `Trendsetter complete! ${finalTarget?.users?.name ?? 'Rival'} lost -${actualLoss} MS.`,
        data: {
          rivalId: finalTarget?.student_id,
          rivalName: finalTarget?.users?.name,
          rivalLostMS: actualLoss,
          rivalNewMS: newMS,
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
        message: 'Failed to apply Trendsetter perk',
        error: message,
      });
    }
  }
}
