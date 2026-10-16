import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';

/**
 * Rebirth Perk
 *
 * Effect: Move 2 skill points once the scenario has been revealed. Grants
 * the same "shifting" window the real skill-shift feature already uses
 * (SkillsService.shiftPoints) — this perk just opens it automatically at
 * the right moment instead of the student needing another perk to unlock it.
 *
 * There is no scenario system yet, so this reacts to a placeholder
 * "scenario revealed" event (see class.gateway.ts's 'scenario-revealed'
 * handler) until the real scenario-drawing logic exists.
 *
 * Success Criteria:
 * - Triggered automatically once a scenario is revealed (no manual
 *   activation/approval — reactive, not clicked)
 * - Grants 2 shifting points, letting the student move 2 points between
 *   their own skills via the existing shift-points flow
 * - Repeatable — a new scenario reveal grants another 2 shifting points
 */
export class Rebirth extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(Rebirth.name);
  private static readonly SHIFTING_POINTS = 2;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      await this.prisma.enrolled_students.update({
        where: { id: ctx.student.enrollmentId },
        data: { is_shifting: true, shifting_points: Rebirth.SHIFTING_POINTS },
      });

      // Repeatable — the next scenario reveal grants this again.
      await this.markPerkAsUsed(ctx.perk.id);

      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        trigger: 'scenario_revealed',
        shiftingPoints: Rebirth.SHIFTING_POINTS,
      });

      this.logger.log(
        `Rebirth: scenario revealed for ${ctx.student.name} -> granted ${Rebirth.SHIFTING_POINTS} shifting points`,
      );

      return {
        success: true,
        message: `Rebirth! The scenario has been revealed — you can now move ${Rebirth.SHIFTING_POINTS} skill points between your skills.`,
        data: {
          shiftingEnabled: true,
          shiftingPoints: Rebirth.SHIFTING_POINTS,
          studentId: ctx.student.id,
          studentName: ctx.student.name,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error applying perk: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Rebirth perk',
        error: message,
      });
    }
  }
}
