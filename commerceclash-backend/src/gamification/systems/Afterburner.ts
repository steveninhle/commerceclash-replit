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

type SkillDelta = {
  skillId: string;
  skillName: string;
  amount: number;
};

/**
 * Adds scenario modifiers to the strongest pillars without changing the
 * permanent values used by skill allocation and refunds.
 */
export class Afterburner extends BasePerkEffectHelper implements IPerkEffect {
  private readonly logger = new Logger(Afterburner.name);
  private static readonly POINTS_GAINED = 2;
  private static readonly MAX_SKILL_VALUE = 8;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await lockScenario(tx, ctx.classId);
        const perk = await assertScenarioPerk(tx, ctx, 'afterburner');
        const modifiers = await temporaryModifiers(tx, ctx.classId);
        const latestUsage = await tx.perk_usage.findFirst({
          where: { student_perk_id: ctx.perk.id },
          orderBy: { used_at: 'desc' },
          select: { result_data: true },
        });
        const latestData = latestUsage?.result_data as Record<string, unknown> | undefined;
        if (latestData?.active === true) {
          throw new BadRequestException({
            success: false,
            message: 'Afterburner is already active for the current scenario.',
          });
        }

        const skills = await tx.student_attributes.findMany({
          where: { enrollment_id: ctx.student.enrollmentId },
          select: {
            id: true,
            value: true,
            attributes: { select: { name: true } },
          },
          orderBy: [{ value: 'desc' }, { id: 'asc' }],
        });

        let remaining = Afterburner.POINTS_GAINED;
        const increments: SkillDelta[] = [];
        for (const skill of skills) {
          const value = effectiveSkillValue(skill.value, modifiers.get(skill.id) ?? 0);
          const amount = Math.min(Afterburner.MAX_SKILL_VALUE - value, remaining);
          if (amount > 0) {
            increments.push({
              skillId: skill.id,
              skillName: skill.attributes.name,
              amount,
            });
            remaining -= amount;
          }
          if (remaining === 0) break;
        }

        if (remaining > 0) {
          return {
            success: false,
            message: 'Afterburner needs two open skill slots, but your pillars are already full.',
          };
        }

        await recordScenarioPerk(tx, ctx, perk.perks.is_repeatable, {
          perkKey: 'afterburner',
          accounting: 'modifier',
          temporaryScenarioEffect: true,
          active: true,
          increments,
          affectedStudentIds: [ctx.student.id],
        });

        this.logger.log(
          `Afterburner: added ${Afterburner.POINTS_GAINED} temporary points for ${ctx.student.name}`,
        );

        return {
          success: true,
          message: 'Afterburner engaged! Two temporary skill points are active for this scenario.',
          data: {
            temporaryScenarioEffect: true,
            pointsGained: Afterburner.POINTS_GAINED,
            increments,
            affectedStudentIds: [ctx.student.id],
          },
        };
      });
    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to apply Afterburner: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Afterburner perk',
        error: message,
      });
    }
  }
}
