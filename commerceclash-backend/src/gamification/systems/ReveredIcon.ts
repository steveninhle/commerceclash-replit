import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';
import { ClassGateway } from 'src/class/class.gateway';

/**
 * Revered Icon Perk (Commander - Ultra)
 *
 * Effect: When a rival activates ANY perk, Commander may press "Cancel" to block it.
 *
 * Success Criteria:
 * - When a rival activates ANY perk, Commander may press "Cancel"
 * - Cancel must be done within the same phase (10 second window)
 * - Rival perk never executes if cancelled
 * - Commander perk is consumed when used to cancel
 *
 * Example:
 * - Rival Explorer activates "Corporate Espionage"
 * - Commander sees notification with Cancel button
 * - Commander clicks Cancel within 10 seconds
 * - Explorer's perk is blocked, gains no access
 * - Commander's Revered Icon is consumed
 *
 * Implementation:
 * - This perk is PASSIVE - it doesn't need to be manually activated
 * - When any perk is activated in the class, system checks for Commanders with Revered Icon
 * - If found, they get a chance to cancel the rival's perk
 */
export class ReveredIcon extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(ReveredIcon.name);

  // Time window (in ms) for Commander to cancel a rival's perk
  static readonly CANCEL_WINDOW_MS = 10000; // 10 seconds

  constructor(
    _classGateway: ClassGateway, // Kept for interface compatibility
    prisma: PrismaService,
  ) {
    super(prisma);
  }

  /**
   * Check if there's a Commander with Revered Icon available in the class
   * Returns the Commander's info if found, null otherwise
   */
  static async findAvailableReveredIcon(
    prisma: PrismaService,
    classId: string,
    excludeStudentId: string, // Don't count the student activating a perk
  ): Promise<{
    commanderId: string;
    commanderName: string;
    commanderEnrollmentId: string;
    reveredIconPerkId: string;
  } | null> {
    const logger = new Logger('ReveredIcon.findAvailable');

    try {
      // Find a Commander archetype student with unlocked, unused Revered Icon
      const commanderWithPerk = await prisma.enrolled_students.findFirst({
        where: {
          class_id: classId,
          student_id: { not: excludeStudentId },
          is_cancelled: { not: true },
          archtypes: {
            title: { contains: 'COMMANDER', mode: 'insensitive' },
          },
          student_perks: {
            some: {
              perks: {
                key: { in: ['revered_icon', 'Revered-Icon', 'revered-icon'] },
              },
              is_unlocked: true,
              is_used: false,
            },
          },
        },
        include: {
          users: { select: { name: true } },
          student_perks: {
            where: {
              perks: {
                key: { in: ['revered_icon', 'Revered-Icon', 'revered-icon'] },
              },
              is_unlocked: true,
              is_used: false,
            },
            include: { perks: true },
          },
        },
      });

      if (!commanderWithPerk || commanderWithPerk.student_perks.length === 0) {
        return null;
      }

      logger.log(`Found Commander ${commanderWithPerk.users?.name} with Revered Icon available`);

      return {
        commanderId: commanderWithPerk.student_id,
        commanderName: commanderWithPerk.users?.name ?? 'Commander',
        commanderEnrollmentId: commanderWithPerk.id,
        reveredIconPerkId: commanderWithPerk.student_perks[0].id,
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error finding Revered Icon: ${errorMsg}`);
      return null;
    }
  }

  /**
   * This apply method is called when Commander manually activates Revered Icon
   * (for backwards compatibility, though the perk is meant to be passive)
   */
  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      this.logger.log(`Revered Icon activated by ${ctx.student.name} - now in guardian mode`);

      // Don't mark as used yet - it's consumed when actually used to cancel a perk
      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        action: 'Guardian mode activated',
      });

      return {
        success: true,
        message:
          'Revered Icon is active! You can now cancel one rival perk when they try to use it.',
        data: {
          guardianMode: true,
          commanderId: ctx.student.id,
          commanderName: ctx.student.name,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error applying perk: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Revered Icon perk',
        error: message,
      });
    }
  }

  /**
   * Cancel a rival's perk using Revered Icon
   * Called when Commander clicks "Cancel" on a pending rival perk
   */
  static async cancelRivalPerk(
    prisma: PrismaService,
    reveredIconPerkId: string,
    commanderEnrollmentId: string,
    rivalPerkId: string,
    rivalName: string,
    rivalPerkTitle: string,
  ): Promise<{ success: boolean; message: string }> {
    const logger = new Logger('ReveredIcon.cancelRivalPerk');

    try {
      // Mark Revered Icon as used
      await prisma.student_perks.update({
        where: { id: reveredIconPerkId },
        data: {
          is_used: true,
          is_approved: false,
        },
      });

      // Reset the rival's perk status back to "request" (not approved)
      await prisma.student_perks.update({
        where: { id: rivalPerkId },
        data: {
          is_approved: false,
          perk_status: 'pending',
        },
      });

      // Log the usage
      await prisma.perk_usage.create({
        data: {
          student_perk_id: reveredIconPerkId,
          enrollment_id: commanderEnrollmentId,
          used_at: new Date(),
          result_data: {
            action: 'Cancelled rival perk',
            cancelledPerkId: rivalPerkId,
            cancelledPerkTitle: rivalPerkTitle,
            rivalName: rivalName,
          },
        },
      });

      logger.log(`Revered Icon used to cancel ${rivalName}'s ${rivalPerkTitle}`);

      return {
        success: true,
        message: `Revered Icon used! ${rivalName}'s ${rivalPerkTitle} has been cancelled!`,
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error cancelling rival perk: ${errorMsg}`);
      return {
        success: false,
        message: 'Failed to cancel rival perk',
      };
    }
  }
}
