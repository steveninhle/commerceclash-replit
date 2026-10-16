import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';
import { SabotageRival } from '../utils/types/types';

/**
 * Sabotage Perk (Diplomat - Core)
 *
 * Effect: Unlocks one rival's skill tree and allows redistributing up to 3 of their points.
 *
 * Success Criteria:
 * - Activatable after normal skill-point spending period
 * - Unlocks ONE rival's skill tree (not all)
 * - Student may move up to 3 points from one rival's tree into another tree for that same rival
 * - Cannot touch multiple rivals
 *
 * Example:
 * - Rival currently: Strategy: 5, Creativity: 2, Influence: 1
 * - Diplomat shifts 3 points: Strategy –2, Creativity –1 → Influence +3
 *
 * Flow:
 * 1. Phase 1: No target - returns list of available rivals
 * 2. Phase 2: Target selected - returns rival's skill tree for manipulation
 * 3. Phase 3: Redistribution submitted - applies the changes
 */
export class Sabotage extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(Sabotage.name);

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      // Get data from additional data
      const targetStudentId = ctx.additionalData?.targetStudentId as string | undefined;
      const redistribution = ctx.additionalData?.redistribution as
        | {
            decrements: { skillId: string; amount: number }[];
            increments: { skillId: string; amount: number }[];
          }
        | undefined;

      // Fetch all rivals with their skills
      const rivals: (SabotageRival & {
        users: { name: string | null } | null;
        id: string;
        market_share: number | null;
        archtypes: { title: string } | null;
      })[] = await this.prisma.enrolled_students.findMany({
        where: {
          class_id: ctx.classId,
          NOT: { student_id: ctx.student.id },
          is_cancelled: { not: true },
        },
        select: {
          id: true,
          student_id: true,
          is_cancelled: true,
          market_share: true,
          student_attributes: {
            select: {
              id: true,
              value: true,
              attributes: { select: { name: true } },
            },
          },
          users: { select: { name: true } },
          archtypes: { select: { title: true } },
        },
      });

      if (rivals.length === 0) {
        return { success: false, message: 'No rivals found to sabotage' };
      }

      // ========== PHASE 1: Select a rival ==========
      if (!targetStudentId) {
        const rivalOptions = rivals.map((r) => ({
          id: r.student_id,
          name: r.users?.name ?? 'Unknown',
          marketShare: r.market_share ?? 0,
          ceo: r.archtypes ? { title: r.archtypes.title } : undefined,
        }));

        this.logger.log(`Sabotage phase 1: Returning ${rivalOptions.length} rivals for selection`);

        return {
          success: true,
          message: 'Select a rival to sabotage',
          data: {
            phase: 1,
            requiresSelection: true,
            pendingCompletion: true,
            rivals: rivalOptions,
          },
        };
      }

      // Find the selected target
      const target = rivals.find((r) => r.student_id === targetStudentId);

      if (!target) {
        return {
          success: false,
          message: 'Selected rival not found or is not in this class.',
        };
      }

      // ========== PHASE 2: Show rival's skill tree for redistribution ==========
      if (!redistribution) {
        // Return the rival's skill tree for the diplomat to manipulate
        const skillTree = target.student_attributes.map((attr) => ({
          skillId: attr.id,
          skillName: (attr as { attributes?: { name: string } }).attributes?.name ?? 'Unknown',
          currentValue: attr.value,
        }));

        this.logger.log(
          `Sabotage phase 2: Showing ${target.users?.name}'s skill tree for redistribution`,
        );

        return {
          success: true,
          message: `View ${target.users?.name ?? 'rival'}'s skill tree and redistribute up to 3 points`,
          data: {
            phase: 2,
            requiresRedistribution: true,
            pendingCompletion: true,
            targetId: targetStudentId,
            targetName: target.users?.name ?? 'Unknown',
            skillTree,
            maxPointsToMove: 3,
          },
        };
      }

      // ========== PHASE 3: Apply the redistribution ==========
      const { decrements, increments } = redistribution;

      // Validate the redistribution
      const totalDecrement = decrements.reduce((sum, d) => sum + d.amount, 0);
      const totalIncrement = increments.reduce((sum, i) => sum + i.amount, 0);

      if (totalDecrement !== totalIncrement) {
        throw new BadRequestException({
          success: false,
          message: 'Total points removed must equal total points added.',
        });
      }

      if (totalDecrement > 3) {
        throw new BadRequestException({
          success: false,
          message: 'Cannot redistribute more than 3 points.',
        });
      }

      if (totalDecrement === 0) {
        throw new BadRequestException({
          success: false,
          message: 'Must redistribute at least 1 point.',
        });
      }

      // Validate that all skill IDs belong to the target
      const targetSkillIds = new Set(target.student_attributes.map((a) => a.id));
      for (const dec of decrements) {
        if (!targetSkillIds.has(dec.skillId)) {
          throw new BadRequestException({
            success: false,
            message: 'Invalid skill ID in decrements.',
          });
        }
      }
      for (const inc of increments) {
        if (!targetSkillIds.has(inc.skillId)) {
          throw new BadRequestException({
            success: false,
            message: 'Invalid skill ID in increments.',
          });
        }
      }

      // Validate that decrements don't exceed current values
      for (const dec of decrements) {
        const skill = target.student_attributes.find((a) => a.id === dec.skillId);
        if (!skill || skill.value < dec.amount) {
          throw new BadRequestException({
            success: false,
            message: `Cannot remove ${dec.amount} points from a skill with only ${skill?.value ?? 0} points.`,
          });
        }
      }

      // Validate that increments don't exceed max (8)
      for (const inc of increments) {
        const skill = target.student_attributes.find((a) => a.id === inc.skillId);
        if (!skill || skill.value + inc.amount > 8) {
          throw new BadRequestException({
            success: false,
            message: `Cannot add ${inc.amount} points to a skill that would exceed 8.`,
          });
        }
      }

      // Execute the redistribution in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Apply decrements
        for (const dec of decrements) {
          await tx.student_attributes.update({
            where: { id: dec.skillId },
            data: { value: { decrement: dec.amount } },
          });
        }
        // Apply increments
        for (const inc of increments) {
          await tx.student_attributes.update({
            where: { id: inc.skillId },
            data: { value: { increment: inc.amount } },
          });
        }
      });

      this.logger.log(
        `Sabotage complete: ${ctx.student.name} redistributed ${totalDecrement} points in ${target.users?.name}'s skill tree`,
      );

      await this.markPerkAsUsed(ctx.perk.id);

      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        targetRival: target.student_id,
        targetName: target.users?.name,
        redistributedPoints: totalDecrement,
        decrements,
        increments,
      });

      return {
        success: true,
        message: `Sabotage successful! Redistributed ${totalDecrement} points in ${target.users?.name ?? 'rival'}'s skill tree!`,
        data: {
          rival: target.student_id,
          rivalName: target.users?.name,
          redistributedPoints: totalDecrement,
          decrements,
          increments,
          affectedStudentIds: [target.student_id],
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
        message: 'Failed to apply Sabotage perk',
        error: message,
      });
    }
  }
}
