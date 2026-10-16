import { IPerkEffect, IPerkEffectContext, IPerkEffectResult } from '../core/interfaces/IPerkEffect';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { BasePerkEffectHelper } from '../core/BasicPerkEffectHelper';
import { PrismaService } from '@utils/prisma/prisma.service';

export class Wipeout extends BasePerkEffectHelper implements IPerkEffect {
  private logger = new Logger(Wipeout.name);

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async apply(ctx: IPerkEffectContext): Promise<IPerkEffectResult> {
    try {
      const rivals = await this.prisma.enrolled_students.findMany({
        where: {
          class_id: ctx.classId,
          NOT: { student_id: ctx.student.id },
        },
        include: {
          student_attributes: true,
        },
      });
      const activeRivals = rivals.filter((rival) => !rival.is_cancelled);
      await Promise.all(
        activeRivals.map(async (rival) => {
          let pointsToRemove = 2;

          const shuffled = [...rival.student_attributes].sort(() => Math.random() - 0.5);

          for (const attr of shuffled) {
            if (pointsToRemove <= 0) break;

            const deduction = Math.min(attr.value, pointsToRemove);
            if (deduction > 0) {
              await this.prisma.student_attributes.update({
                where: { id: attr.id },
                data: { value: { decrement: deduction } },
              });
              pointsToRemove -= deduction;
            }
          }

          this.logger.debug(
            `Reduced ${2 - pointsToRemove} total points from rival ${rival.student_id}`,
          );
        }),
      );

      await this.markPerkAsUsed(ctx.perk.id);

      await this.logPerkUsage(ctx.perk.id, ctx.student.enrollmentId, {
        affectedRivals: rivals.length,
        removedPoints: 2,
      });

      return {
        success: true,
        message: `Wipeout activated: all rivals lost 2 random skill points.`,
        data: {
          affected: rivals.length,
          affectedStudentIds: activeRivals.map((r) => r.student_id),
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error applying perk: ${message}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply Wipeout perk',
        error: message,
      });
    }
  }
}
