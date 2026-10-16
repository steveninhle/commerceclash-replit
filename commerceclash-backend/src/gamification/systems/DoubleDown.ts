import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';
import { ClassGateway } from 'src/class/class.gateway';

/**
 * Double-Down Perk (Baron - Core)
 *
 * Effect: When you win a scenario (1st place), automatically steal the runner-up's
 * market share that they would have gained.
 *
 * Success Criteria:
 * - Triggered automatically after winning a scenario (1st place)
 * - Runner-up's MS is transferred to the Baron
 * - Runner-up loses that MS; Baron gains equal MS
 * - Works every time they win (repeatable)
 *
 * Note: This perk can be triggered automatically by the system when market share
 * is updated and a Baron player is in first place.
 */
export class DoubleDown extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(DoubleDown.name);

  constructor(
    private readonly classGateway: ClassGateway,
    prisma: PrismaService,
  ) {
    super(prisma);
  }

  /**
   * Check if a student has Double-Down perk unlocked and available
   */
  static async checkDoubleDownAvailable(
    prisma: PrismaService,
    enrollmentId: string,
  ): Promise<{ available: boolean; studentPerkId?: string; perkId?: string }> {
    // Find the student's Double-Down perk
    const studentPerk = await prisma.student_perks.findFirst({
      where: {
        enrollment_id: enrollmentId,
        perks: {
          key: { contains: 'double_down', mode: 'insensitive' },
        },
        is_unlocked: true,
      },
      include: {
        perks: true,
      },
    });

    if (!studentPerk) {
      return { available: false };
    }

    // Check if perk is available (not used, or if repeatable and cooldown passed)
    const isRepeatable = studentPerk.perks.is_repeatable;

    if (!studentPerk.is_used) {
      return {
        available: true,
        studentPerkId: studentPerk.id,
        perkId: studentPerk.perk_id,
      };
    }

    if (isRepeatable && studentPerk.next_available_at) {
      const cooldownPassed = new Date() >= studentPerk.next_available_at;
      if (cooldownPassed) {
        return {
          available: true,
          studentPerkId: studentPerk.id,
          perkId: studentPerk.perk_id,
        };
      }
    }

    return { available: false };
  }

  /**
   * Check if a student is a Baron (has Baron archetype)
   */
  static async isBaron(prisma: PrismaService, enrollmentId: string): Promise<boolean> {
    const enrollment = await prisma.enrolled_students.findUnique({
      where: { id: enrollmentId },
      include: {
        archtypes: true,
      },
    });

    if (!enrollment?.archtypes) {
      return false;
    }

    // Check if archetype is Baron (case-insensitive)
    return enrollment.archtypes.title.toLowerCase().includes('baron');
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      // Get all students in the class ranked by market share
      const rankings = await this.prisma.enrolled_students.findMany({
        where: {
          class_id: ctx.classId,
          is_cancelled: { not: true },
        },
        orderBy: { market_share: 'desc' },
        select: {
          id: true,
          student_id: true,
          market_share: true,
          users: { select: { name: true } },
        },
      });

      if (rankings.length < 2) {
        return {
          success: false,
          message: 'Not enough players in the class to use Double-Down.',
        };
      }

      const firstPlace = rankings[0];
      const secondPlace = rankings[1];

      // Check if the student is in first place
      if (firstPlace.student_id !== ctx.student.id) {
        return {
          success: false,
          message: `Double-Down failed: you are not in 1st place. Current leader is ${firstPlace.users?.name ?? 'another student'}.`,
        };
      }

      // Check if runner-up has any market share to steal
      const runnerUpMarketShare = secondPlace.market_share ?? 0;
      if (runnerUpMarketShare <= 0) {
        return {
          success: false,
          message: `Double-Down failed: ${secondPlace.users?.name ?? 'The runner-up'} has 0 market share. Make sure the teacher has saved market share values for this round before approving this perk.`,
        };
      }

      // Give the runner-up a chance to redirect this loss via Fan the Flames
      // before it's actually applied.
      const decision = await this.classGateway.checkAndOfferFanTheFlames(
        ctx.classId,
        secondPlace.student_id,
        secondPlace.id,
        runnerUpMarketShare,
        'Double-Down',
        ctx.student.name ?? 'The leader',
      );

      const finalTarget = await this.prisma.enrolled_students.findUnique({
        where: { id: decision.finalTargetEnrollmentId },
        select: { market_share: true, student_id: true, users: { select: { name: true } } },
      });
      const finalTargetMS = finalTarget?.market_share ?? 0;
      const actualStolen = Math.min(runnerUpMarketShare, finalTargetMS);
      const newTargetMS = finalTargetMS - actualStolen;

      // Steal the market share
      await this.prisma.$transaction([
        // Add the stolen amount to the winner
        this.prisma.enrolled_students.update({
          where: { id: ctx.student.enrollmentId },
          data: { market_share: { increment: actualStolen } },
        }),
        // Deduct it from whoever ended up taking the loss
        this.prisma.enrolled_students.update({
          where: { id: decision.finalTargetEnrollmentId },
          data: { market_share: newTargetMS },
        }),
      ]);

      await this.markPerkAsUsed(ctx.perk.id);

      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        stolenFrom: finalTarget?.student_id,
        stolenFromName: finalTarget?.users?.name ?? 'Unknown',
        stolenAmount: actualStolen,
        wasRedirected: decision.wasRedirected,
      });

      return {
        success: true,
        message: `Double-Down activated! You stole ${actualStolen} market share from ${finalTarget?.users?.name ?? 'the runner-up'}.`,
        data: {
          stolenFrom: finalTarget?.student_id,
          stolenFromName: finalTarget?.users?.name,
          stolenAmount: actualStolen,
          baronId: ctx.student.id,
          baronName: ctx.student.name,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error applying perk: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Double-Down perk',
        error: message,
      });
    }
  }
}
