import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '@utils/prisma/prisma.service';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { UPCOMING_SCENARIO_TYPE } from '../utils/types/types';
import { assertScenarioPerk, lockScenario, recordScenarioPerk } from '../utils/scenarioEffects';

/** Prototype reveal powered by the shared hard-coded upcoming scenario type. */
export class InsiderTrading extends BasePerkEffectHelper implements IPerkEffect {
  private readonly logger = new Logger(InsiderTrading.name);

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await lockScenario(tx, ctx.classId);
        const perk = await assertScenarioPerk(tx, ctx, 'insider_trading');
        await recordScenarioPerk(tx, ctx, perk.perks.is_repeatable, {
          perkKey: 'insider_trading',
          trigger: 'invest_phase_started',
          revealedType: UPCOMING_SCENARIO_TYPE,
        });

        this.logger.log(
          `Insider Trading revealed "${UPCOMING_SCENARIO_TYPE}" to ${ctx.student.name}`,
        );

        return {
          success: true,
          message: `Insider Trading: the next scenario will be "${UPCOMING_SCENARIO_TYPE}".`,
          data: {
            scenarioType: UPCOMING_SCENARIO_TYPE,
            revealedAt: 'invest_phase_started',
            studentId: ctx.student.id,
          },
        };
      });
    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to apply Insider Trading: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Insider Trading perk',
        error: message,
      });
    }
  }
}
