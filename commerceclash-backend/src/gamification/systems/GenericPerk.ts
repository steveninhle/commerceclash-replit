import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';

/**
 * Generic perk handler for perks that don't have a specific implementation yet.
 * This allows the system to gracefully handle any perk without crashing.
 */
export class GenericPerk extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(GenericPerk.name);
  private perkKey: string;

  constructor(prisma: PrismaService, perkKey: string) {
    super(prisma);
    this.perkKey = perkKey;
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      this.logger.log(`Activating generic perk: ${this.perkKey} (${ctx.perk.title})`);

      // Mark the perk as used
      await this.markPerkAsUsed(ctx.perk.id);

      // Log the perk usage
      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        perkKey: this.perkKey,
        message: 'Generic perk activated - no specific effect implemented',
      });

      return {
        success: true,
        message: `Perk "${ctx.perk.title}" activated successfully.`,
        data: { perkKey: this.perkKey },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error applying generic perk ${this.perkKey}: ${message}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }
}
