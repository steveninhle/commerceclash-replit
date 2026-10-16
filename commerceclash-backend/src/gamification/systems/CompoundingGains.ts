import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';

/**
 * Compounding Gains Perk (Tycoon - Core)
 *
 * Effect: Whenever student places Top 2, system grants +1 extra skill point.
 *
 * Success Criteria:
 * - Triggered automatically when student places Top 2 (1st or 2nd place)
 * - System grants +1 extra skill point to their available_points
 * - Skill point is added immediately to their pool for the next class
 * - Works automatically; no activation needed
 * - Repeatable every time they place Top 2
 *
 * Example:
 * - If Tycoon gets 2nd place:
 *   - Default points next class: 4
 *   - Tycoon points next class: 5
 */
export class CompoundingGains extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(CompoundingGains.name);

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Check if a student has Compounding Gains perk unlocked and available
   */
  static async checkCompoundingGainsAvailable(
    prisma: PrismaService,
    enrollmentId: string,
  ): Promise<{ available: boolean; studentPerkId?: string; perkId?: string }> {
    // Find the student's Compounding Gains perk
    const studentPerk = await prisma.student_perks.findFirst({
      where: {
        enrollment_id: enrollmentId,
        perks: {
          key: { contains: 'compounding', mode: 'insensitive' },
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
   * Check if a student is a Tycoon (has Tycoon archetype)
   */
  static async isTycoon(prisma: PrismaService, enrollmentId: string): Promise<boolean> {
    const enrollment = await prisma.enrolled_students.findUnique({
      where: { id: enrollmentId },
      include: {
        archtypes: true,
      },
    });

    if (!enrollment?.archtypes) {
      return false;
    }

    // Check if archetype is Tycoon (case-insensitive)
    return enrollment.archtypes.title.toLowerCase().includes('tycoon');
  }

  /**
   * Auto-trigger Compounding Gains for a Tycoon in top 2
   * Returns the result of the trigger
   */
  static async autoTrigger(
    prisma: PrismaService,
    enrollmentId: string,
    studentPerkId: string,
    studentName: string,
  ): Promise<{ success: boolean; newAvailablePoints?: number }> {
    const logger = new Logger('CompoundingGains.autoTrigger');

    try {
      // Add +1 to available points
      const updated = await prisma.enrolled_students.update({
        where: { id: enrollmentId },
        data: { available_points: { increment: 1 } },
      });

      // Get perk info for repeatable check
      const studentPerk = await prisma.student_perks.findUnique({
        where: { id: studentPerkId },
        include: { perks: true },
      });

      if (!studentPerk) {
        throw new Error('Student perk not found');
      }

      // Mark perk as used (with cooldown for repeatable)
      if (studentPerk.perks.is_repeatable) {
        await prisma.student_perks.update({
          where: { id: studentPerkId },
          data: {
            is_used: true,
            last_used_at: new Date(),
            next_available_at: new Date(Date.now() + 2 * 60 * 1000), // 2 min cooldown
            is_approved: false,
            perk_status: 'pending',
          },
        });
      } else {
        await prisma.student_perks.update({
          where: { id: studentPerkId },
          data: {
            is_used: true,
            is_approved: false,
          },
        });
      }

      // Log perk usage
      await prisma.perk_usage.create({
        data: {
          student_perk_id: studentPerkId,
          enrollment_id: enrollmentId,
          used_at: new Date(),
          result_data: {
            addedPoints: 1,
            newTotal: updated.available_points,
            triggeredBy: 'auto-top2',
          },
        },
      });

      logger.log(
        `Compounding Gains auto-triggered for ${studentName}: +1 skill point (now ${updated.available_points})`,
      );

      return {
        success: true,
        newAvailablePoints: updated.available_points ?? undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to auto-trigger Compounding Gains: ${message}`);
      return { success: false };
    }
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      const rankings = await this.prisma.enrolled_students.findMany({
        where: { class_id: ctx.classId },
        orderBy: { market_share: 'desc' },
        select: {
          student_id: true,
          market_share: true,
        },
      });
      const topTwo = rankings.slice(0, 2).map((r) => r.student_id);
      if (topTwo.includes(ctx.student.id)) {
        const updated = await this.prisma.enrolled_students.update({
          where: { id: ctx.student.enrollmentId },
          data: { available_points: { increment: 1 } },
        });
        await this.markPerkAsUsed(ctx.perk.id);
        await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, { addedPoints: 1 });
        return {
          success: true,
          message: 'Compounding Gains activated: +1 available points added.',
          data: { available_points: updated.available_points, studentId: ctx.student.id },
        };
      } else {
        return {
          success: false,
          message: 'Compounding Gains perk can only be activated for the top 2 students.',
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error applying perk: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Compounding Gains perk',
        error: message,
      });
    }
  }
}
