import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '@utils/prisma/prisma.service';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import {
  assertScenarioPerk,
  effectiveSkillValue,
  lockScenario,
  recordScenarioPerk,
  temporaryModifiers,
} from '../utils/scenarioEffects';

type SkillRow = {
  id: string;
  value: number;
  attributes: { name: string };
};

type SkillDelta = {
  skillId: string;
  skillName: string;
  amount: number;
};

/** Prototype one-scenario transfer of two skill points from a chosen rival. */
export class Extortion extends BasePerkEffectHelper implements IPerkEffect {
  private readonly logger = new Logger(Extortion.name);
  private static readonly POINTS_TO_STEAL = 2;
  private static readonly MAX_SKILL_VALUE = 8;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  private allocateDeductions(skills: SkillRow[]): SkillDelta[] | null {
    let remaining = Extortion.POINTS_TO_STEAL;
    const deltas: SkillDelta[] = [];

    for (const skill of [...skills].sort((a, b) => b.value - a.value || a.id.localeCompare(b.id))) {
      const amount = Math.min(skill.value, remaining);
      if (amount > 0) {
        deltas.push({ skillId: skill.id, skillName: skill.attributes.name, amount });
        remaining -= amount;
      }
      if (remaining === 0) break;
    }

    return remaining === 0 ? deltas : null;
  }

  private allocateIncrements(skills: SkillRow[]): SkillDelta[] | null {
    let remaining = Extortion.POINTS_TO_STEAL;
    const deltas: SkillDelta[] = [];

    for (const skill of [...skills].sort((a, b) => b.value - a.value || a.id.localeCompare(b.id))) {
      const amount = Math.min(Extortion.MAX_SKILL_VALUE - skill.value, remaining);
      if (amount > 0) {
        deltas.push({ skillId: skill.id, skillName: skill.attributes.name, amount });
        remaining -= amount;
      }
      if (remaining === 0) break;
    }

    return remaining === 0 ? deltas : null;
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await lockScenario(tx, ctx.classId);
        const perk = await assertScenarioPerk(tx, ctx, 'extortion');
        const modifiers = await temporaryModifiers(tx, ctx.classId);
        const targetStudentId = ctx.additionalData?.targetStudentId as string | undefined;
        if (targetStudentId && perk.perk_status !== 'approved') {
          throw new BadRequestException('Start the scenario before choosing an Extortion target.');
        }
        const rivals = await tx.enrolled_students.findMany({
          where: {
            class_id: ctx.classId,
            student_id: { not: ctx.student.id },
            is_cancelled: { not: true },
          },
          select: {
            id: true,
            student_id: true,
            users: { select: { name: true } },
            archtypes: { select: { title: true } },
            student_attributes: {
              select: {
                id: true,
                value: true,
                attributes: { select: { name: true } },
              },
            },
          },
        });

        const effectiveRivals = rivals.map((rival) => ({
          ...rival,
          student_attributes: rival.student_attributes.map((skill) => ({
            ...skill,
            value: effectiveSkillValue(skill.value, modifiers.get(skill.id) ?? 0),
          })),
        }));
        const eligibleRivals = effectiveRivals.filter(
          (rival) =>
            rival.student_attributes.reduce((sum, skill) => sum + skill.value, 0) >=
            Extortion.POINTS_TO_STEAL,
        );

        if (eligibleRivals.length === 0) {
          return { success: false, message: 'No rival has two skill points available to steal.' };
        }

        if (!targetStudentId) {
          return {
            success: true,
            message: 'Extortion is ready. Choose a rival for this scenario.',
            data: {
              phase: 1,
              requiresSelection: true,
              pendingCompletion: true,
              effectType: 'extortion',
              skillPointsToSteal: Extortion.POINTS_TO_STEAL,
              rivals: eligibleRivals.map((rival) => ({
                id: rival.student_id,
                name: rival.users?.name ?? 'Unknown',
                skillPoints: rival.student_attributes.reduce((sum, skill) => sum + skill.value, 0),
                ceo: rival.archtypes ? { title: rival.archtypes.title } : undefined,
              })),
            },
          };
        }

        const target = eligibleRivals.find((rival) => rival.student_id === targetStudentId);
        if (!target) {
          throw new BadRequestException({
            success: false,
            message: 'Selected rival is not eligible for Extortion.',
          });
        }

        const ownSkills = await tx.student_attributes.findMany({
          where: { enrollment_id: ctx.student.enrollmentId },
          select: {
            id: true,
            value: true,
            attributes: { select: { name: true } },
          },
        });

        const deductions = this.allocateDeductions(target.student_attributes);
        const increments = this.allocateIncrements(
          ownSkills.map((skill) => ({
            ...skill,
            value: effectiveSkillValue(skill.value, modifiers.get(skill.id) ?? 0),
          })),
        );
        if (!deductions) {
          throw new BadRequestException({
            success: false,
            message: 'The selected rival no longer has two skill points to steal.',
          });
        }
        if (!increments) {
          throw new BadRequestException({
            success: false,
            message: 'Your pillars do not have room for two temporary skill points.',
          });
        }

        await recordScenarioPerk(tx, ctx, perk.perks.is_repeatable, {
          perkKey: 'extortion',
          accounting: 'modifier',
          temporaryScenarioEffect: true,
          active: true,
          targetEnrollmentId: target.id,
          targetStudentId: target.student_id,
          deductions,
          increments,
          affectedStudentIds: [ctx.student.id, target.student_id],
        });

        this.logger.log(
          `Extortion: ${ctx.student.name} temporarily stole two skill points from ${target.users?.name}`,
        );

        return {
          success: true,
          message: `Extortion succeeded! Two skill points were transferred from ${target.users?.name ?? 'your rival'} for this scenario.`,
          data: {
            temporaryScenarioEffect: true,
            rival: target.student_id,
            rivalName: target.users?.name,
            pointsStolen: Extortion.POINTS_TO_STEAL,
            deductions,
            increments,
            affectedStudentIds: [ctx.student.id, target.student_id],
          },
        };
      });
    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to apply Extortion: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Extortion perk',
        error: message,
      });
    }
  }
}
