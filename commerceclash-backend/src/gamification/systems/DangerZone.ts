import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';
import { ClassGateway } from 'src/class/class.gateway';

/**
 * Danger Zone Perk
 *
 * Effect: Permanently remove 2 of your own skill points to steal 2 Market Share from
 * a rival of your choice.
 *
 * Success Criteria:
 * - One-time use only (perk permanently expires after use)
 * - Student chooses which 2 of their own skill points to give up
 * - Student chooses which rival to steal 2 MS from
 * - MS stolen is capped at the rival's current MS (can't go below 0)
 * - The skill point cost is paid regardless of how much MS is actually stolen
 *
 * Flow:
 * 1. Phase 1: No selection yet - returns the student's own skill tree (to choose
 *    which points to give up) and the list of rivals (to choose a target).
 * 2. Phase 2: skillDeductions + targetStudentId submitted - validates and applies
 *    the point removal and the MS steal in a single transaction.
 *
 * The effect only ever applies once BOTH conditions are satisfied:
 *   (a) exactly `POINTS_TO_REMOVE` of the caster's own skill points are selected, and
 *   (b) a valid rival target is selected.
 * If either is missing, nothing is applied and the response explains which
 * condition(s) still need to be met (without touching approval state).
 */
export class DangerZone extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(DangerZone.name);
  private static readonly POINTS_TO_REMOVE = 2;
  private static readonly MS_TO_STEAL = 2;

  constructor(
    private readonly classGateway: ClassGateway,
    prisma: PrismaService,
  ) {
    super(prisma);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      const targetStudentId = ctx.additionalData?.targetStudentId as string | undefined;
      const skillDeductions = ctx.additionalData?.skillDeductions as
        | { skillId: string; amount: number }[]
        | undefined;

      // Own skill tree (the points being sacrificed always come from the caster)
      const ownAttributes = await this.prisma.student_attributes.findMany({
        where: { enrollment_id: ctx.student.enrollmentId },
        select: {
          id: true,
          value: true,
          attributes: { select: { name: true } },
        },
      });

      // Rivals available to steal MS from
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
        return { success: false, message: 'No rivals found to target' };
      }

      const skillTree = ownAttributes.map((attr) => ({
        skillId: attr.id,
        skillName: attr.attributes.name,
        currentValue: attr.value,
      }));

      const rivalOptions = rivals.map((r) => ({
        id: r.student_id,
        name: r.users?.name ?? 'Unknown',
        marketShare: r.market_share ?? 0,
        ceo: r.archtypes ? { title: r.archtypes.title } : undefined,
      }));

      const target = targetStudentId
        ? rivals.find((r) => r.student_id === targetStudentId)
        : undefined;
      const totalDeduction = (skillDeductions ?? []).reduce((sum, d) => sum + d.amount, 0);

      const hasValidTarget = !!target;
      const hasFullDeduction = totalDeduction === DangerZone.POINTS_TO_REMOVE;

      // ========== Only apply once BOTH conditions are satisfied ==========
      if (!hasValidTarget || !hasFullDeduction) {
        const missing: string[] = [];
        if (!hasFullDeduction) {
          missing.push(
            `select exactly ${DangerZone.POINTS_TO_REMOVE} of your own skill points to sacrifice (currently ${totalDeduction} selected)`,
          );
        }
        if (!hasValidTarget) {
          missing.push('select a rival to steal MS from');
        }

        const isFreshStart = !targetStudentId && !skillDeductions;

        this.logger.log(
          `Danger Zone: condition(s) not yet met — ${missing.join('; ')}. Returning selection screen.`,
        );

        return {
          success: true,
          message: isFreshStart
            ? `Choose ${DangerZone.POINTS_TO_REMOVE} of your own skill points to give up, and a rival to steal ${DangerZone.MS_TO_STEAL} MS from.`
            : `Not applied yet — you still need to ${missing.join(' and ')}.`,
          data: {
            phase: 1,
            requiresSelection: true,
            pendingCompletion: true,
            skillTree,
            pointsToRemove: DangerZone.POINTS_TO_REMOVE,
            msToSteal: DangerZone.MS_TO_STEAL,
            rivals: rivalOptions,
            missingConditions: {
              needsSkillSelection: !hasFullDeduction,
              needsTargetSelection: !hasValidTarget,
            },
          },
        };
      }

      // ========== Both conditions satisfied: validate details and apply ==========
      // Narrowed now that hasValidTarget/hasFullDeduction guaranteed these are defined.
      const confirmedTarget = target;
      const confirmedDeductions = skillDeductions as { skillId: string; amount: number }[];

      const ownSkillIds = new Set(ownAttributes.map((a) => a.id));
      const selectedSkillIds = new Set<string>();
      for (const dec of confirmedDeductions) {
        if (!ownSkillIds.has(dec.skillId)) {
          throw new BadRequestException({
            success: false,
            message: 'Invalid skill selected — it does not belong to you.',
          });
        }
        if (selectedSkillIds.has(dec.skillId)) {
          throw new BadRequestException({
            success: false,
            message: 'Each skill may only be selected once.',
          });
        }
        selectedSkillIds.add(dec.skillId);
        if (!Number.isInteger(dec.amount) || dec.amount <= 0) {
          throw new BadRequestException({
            success: false,
            message: 'Deduction amounts must be positive whole numbers.',
          });
        }
      }

      for (const dec of confirmedDeductions) {
        const skill = ownAttributes.find((a) => a.id === dec.skillId);
        if (!skill || skill.value < dec.amount) {
          throw new BadRequestException({
            success: false,
            message: `Cannot remove ${dec.amount} points from a skill with only ${skill?.value ?? 0} points.`,
          });
        }
      }

      const intendedSteal = Math.min(DangerZone.MS_TO_STEAL, confirmedTarget.market_share ?? 0);

      // Give the original target a chance to redirect this loss via Fan the Flames
      // before it's actually applied.
      const decision = await this.classGateway.checkAndOfferFanTheFlames(
        ctx.classId,
        confirmedTarget.student_id,
        confirmedTarget.id,
        intendedSteal,
        'Danger Zone',
        ctx.student.name ?? 'A rival',
      );

      const finalTarget = await this.prisma.enrolled_students.findUnique({
        where: { id: decision.finalTargetEnrollmentId },
        select: { market_share: true, student_id: true, users: { select: { name: true } } },
      });
      const currentTargetMS = finalTarget?.market_share ?? 0;
      const actualStolen = Math.min(DangerZone.MS_TO_STEAL, currentTargetMS);
      const newTargetMS = currentTargetMS - actualStolen;

      await this.prisma.$transaction(async (tx) => {
        for (const dec of confirmedDeductions) {
          await tx.student_attributes.update({
            where: { id: dec.skillId },
            data: { value: { decrement: dec.amount } },
          });
        }

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
        `Danger Zone complete: ${ctx.student.name} gave up ${totalDeduction} skill points to steal ${actualStolen} MS from ${finalTarget?.users?.name}${decision.wasRedirected ? ' (redirected by Fan the Flames)' : ''}`,
      );

      // One-time use only - permanently expires after this
      await this.markPerkAsUsed(ctx.perk.id);

      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        skillDeductions: confirmedDeductions,
        pointsRemoved: totalDeduction,
        targetRival: finalTarget?.student_id,
        targetName: finalTarget?.users?.name,
        msStolen: actualStolen,
        targetNewMS: newTargetMS,
        wasRedirected: decision.wasRedirected,
      });

      return {
        success: true,
        message: `Danger Zone activated! You gave up ${totalDeduction} skill points and stole ${actualStolen} MS from ${finalTarget?.users?.name ?? 'your rival'}.`,
        data: {
          pointsRemoved: totalDeduction,
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
        message: 'Failed to apply Danger Zone perk',
        error: message,
      });
    }
  }
}
