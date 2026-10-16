import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';
import { UPCOMING_SCENARIO_TYPE } from '../utils/types/types';

/**
 * Crystal Ball Perk
 *
 * Effect: Permanently view the upcoming scenario type — a popup revealing
 * which scenario will be chosen next appears at the start of the invest
 * phase. Unlike Prophecy, this is a pure reveal: no guessing, no reward or
 * penalty tied to it.
 *
 * There is no scenario system yet, so the revealed type is the shared
 * UPCOMING_SCENARIO_TYPE placeholder (see utils/types/types.ts) until the
 * real scenario-drawing logic exists and can supply the real type instead.
 *
 * Success Criteria:
 * - Triggered automatically at the start of the invest phase (no manual
 *   activation/approval — reactive, not clicked)
 * - "Permanently" — the reveal recurs every invest phase, not a one-time use
 */
export class CrystalBall extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(CrystalBall.name);

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      // Repeatable — resolves (and resets, via markPerkAsUsed) every invest phase.
      await this.markPerkAsUsed(ctx.perk.id);

      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        trigger: 'invest_phase_started',
        revealedType: UPCOMING_SCENARIO_TYPE,
      });

      this.logger.log(
        `Crystal Ball: revealed upcoming scenario type "${UPCOMING_SCENARIO_TYPE}" to ${ctx.student.name}`,
      );

      return {
        success: true,
        message: `🔮 Crystal Ball reveals: the next scenario will be "${UPCOMING_SCENARIO_TYPE}".`,
        data: {
          scenarioType: UPCOMING_SCENARIO_TYPE,
          studentId: ctx.student.id,
          studentName: ctx.student.name,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error applying perk: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Crystal Ball perk',
        error: message,
      });
    }
  }
}
