import { requiredPerkLevel } from '../utils/reactivePerkKeys';
import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';
import { ClassGateway } from 'src/class/class.gateway';

/**
 * Fan the Flames Perk
 *
 * Effect: Whenever another perk (Trendsetter, Star Power, Danger Zone,
 * Double Down) would cost you Market Share, you get a short live window to
 * pick a different player to take that loss instead of you.
 *
 * Implementation (mirrors Revered Icon's passive-guardian pattern):
 * - PASSIVE — no manual activation required once unlocked. `apply()` only
 *   exists for interface compliance if a student manually requests it.
 * - The actual interception happens inside each MS-loss-causing perk, which
 *   calls `ClassGateway.checkAndOfferFanTheFlames` at the exact moment it's
 *   about to decrement the holder's market_share. That call finds this perk
 *   via `findAvailable`, offers the holder a live choice with a countdown,
 *   and resolves to whichever enrollment should actually take the loss.
 * - Repeatable — a short cooldown after each redirect, then available again.
 */
export class FanTheFlames extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(FanTheFlames.name);

  static readonly DECISION_WINDOW_MS = 10000; // 10 seconds

  constructor(
    _classGateway: ClassGateway, // kept for interface compatibility
    prisma: PrismaService,
  ) {
    super(prisma);
  }

  /**
   * Check if a specific student currently has Fan the Flames available to
   * redirect an incoming MS loss.
   */
  static async findAvailable(
    prisma: PrismaService,
    victimEnrollmentId: string,
  ): Promise<{ studentPerkId: string } | null> {
    const studentPerk = await prisma.student_perks.findFirst({
      where: {
        enrollment_id: victimEnrollmentId,
        perks: { key: 'fan_the_flames' },
        is_unlocked: true,
        is_approved: true,
        perk_status: 'approved',
      },
      include: { perks: { include: { perk_types: true } }, enrolled_students: true },
    });

    if (
      !studentPerk ||
      !studentPerk.is_approved ||
      studentPerk.perk_status !== 'approved' ||
      studentPerk.enrolled_students.is_cancelled ||
      studentPerk.enrolled_students.archtype_id !== studentPerk.perks.archtype_id ||
      (studentPerk.enrolled_students.level ?? 1) <
        requiredPerkLevel(studentPerk.perks.perk_types.type)
    )
      return null;

    if (!studentPerk.is_used) {
      return { studentPerkId: studentPerk.id };
    }

    // Repeatable and cooldown passed — available again even though is_used is still true.
    if (
      studentPerk.perks.is_repeatable &&
      studentPerk.next_available_at &&
      new Date() >= studentPerk.next_available_at
    ) {
      return { studentPerkId: studentPerk.id };
    }

    return null;
  }

  /**
   * Consumes the perk instance after a successful redirect (with the
   * standard repeatable cooldown, matching BasePerkEffectHelper.markPerkAsUsed).
   */
  static async markUsedAfterRedirect(
    prisma: PrismaService,
    fanTheFlamesPerkId: string,
  ): Promise<void> {
    const studentPerk = await prisma.student_perks.findUnique({
      where: { id: fanTheFlamesPerkId },
      include: { perks: true },
    });
    if (!studentPerk) return;

    if (studentPerk.perks.is_repeatable) {
      await prisma.student_perks.update({
        where: { id: fanTheFlamesPerkId },
        data: {
          is_used: true,
          last_used_at: new Date(),
          next_available_at: new Date(Date.now() + 2 * 60 * 1000),
          is_approved: false,
          perk_status: null,
        },
      });
    } else {
      await prisma.student_perks.update({
        where: { id: fanTheFlamesPerkId },
        data: { is_used: true, is_approved: false },
      });
    }
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      this.logger.log(
        `Fan the Flames activated by ${ctx.student.name} - now guarding against MS loss`,
      );

      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        action: 'Guardian mode activated',
      });

      return {
        success: true,
        message:
          'Fan the Flames is active! If another perk would cost you Market Share, you can redirect it to another player.',
        data: {
          guardianMode: true,
          studentId: ctx.student.id,
          studentName: ctx.student.name,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error applying perk: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Fan the Flames perk',
        error: message,
      });
    }
  }
}
