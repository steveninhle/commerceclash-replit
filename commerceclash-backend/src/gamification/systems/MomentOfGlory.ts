import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';
import { ClassGateway } from 'src/class/class.gateway';
import { MomentOfGloryDto } from 'src/class/dto/perk-dto/moment-of-glory.dto';

export class MomentOfGlory extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(MomentOfGlory.name);

  constructor(
    private readonly classGateway: ClassGateway,
    prisma: PrismaService,
  ) {
    super(prisma);
  }
  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      const marketShare = await this.prisma.enrolled_students.findUnique({
        where: { id: ctx.student.enrollmentId },
        select: { market_share: true },
      });

      if (!marketShare || marketShare.market_share === null) {
        throw new Error('Market share data not found for the student.');
      }
      const data: MomentOfGloryDto = {
        classId: ctx.classId,
        teacherId: ctx.teacherId ?? 'unknown',
        student: {
          id: ctx.student.id,
          name: ctx.student.name ?? 'unknown',
          marketShare: marketShare.market_share,
        },
      };
      this.classGateway.emitMomentOfGlory(data);
      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, { marketShare: 'Gain/Loss' });
      return {
        success: true,
        message: 'Moment of Glory is activated Teacher will update you MarketShare soon.',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error applying perk: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Moment of Glory perk',
        error: message,
      });
    }
  }
}
