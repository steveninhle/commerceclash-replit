import { PrismaService } from '@utils/prisma/prisma.service';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';

export class StrategicRebith extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(StrategicRebith.name);

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      // Check if student is in skill-point selection phase (skills must be unlocked)
      const enrollment = await this.prisma.enrolled_students.findUnique({
        where: { id: ctx.student.enrollmentId },
        select: { skill_unlocked: true },
      });

      if (!enrollment?.skill_unlocked) {
        throw new BadRequestException({
          success: false,
          message:
            'Strategic Rebirth can only be activated during the skill-point selection phase (skills must be unlocked).',
        });
      }

      await this.prisma.enrolled_students.update({
        where: { id: ctx.student.enrollmentId },
        data: { is_shifting: true, shifting_points: 2 },
      });
      await this.markPerkAsUsed(ctx.perk.id);
      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        shiftingPoints: 'Gain 2 Shifting Points',
      });
      return {
        success: true,
        message: 'Strategic Rebirth has been activated. You can shift up to 2 skill points.',
        data: {
          shiftingEnabled: true,
          shiftingPoints: 2,
          studentId: ctx.student.id,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error applying perk: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Strategic Rebirth perk',
        error: message,
      });
    }
  }
}
