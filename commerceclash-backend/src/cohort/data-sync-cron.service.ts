import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@utils/prisma/prisma.service';

@Injectable()
export class DataSyncCronService {
  private readonly logger = new Logger(DataSyncCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async syncDataBeforeClassStart() {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 9 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 11 * 60 * 1000);

    const upcomingClasses = await this.prisma.renamedclass.findMany({
      where: {
        cohort_id: { not: null },
        start_time: { gte: windowStart, lte: windowEnd },
      },
      select: { id: true, cohort_id: true, start_time: true },
    });

    if (upcomingClasses.length === 0) return;

    for (const cls of upcomingClasses) {
      try {
        const prevClass = await this.prisma.renamedclass.findFirst({
          where: {
            cohort_id: cls.cohort_id,
            id: { not: cls.id },
            start_time: { lt: cls.start_time ?? new Date() },
          },
          orderBy: { start_time: 'desc' },
          select: {
            enrolled_students: {
              select: {
                student_id: true,
                xp: true,
                level: true,
                market_share: true,
                archtype_id: true,
                available_points: true,
                skill_unlocked: true,
                student_attributes: { select: { attribute_id: true, value: true } },
                student_perks: {
                  select: {
                    perk_id: true,
                    is_unlocked: true,
                    is_used: true,
                    is_approved: true,
                    perk_status: true,
                  },
                },
              },
            },
          },
        });

        const sourceEnrollments = prevClass?.enrolled_students ?? [];
        if (sourceEnrollments.length === 0) continue;

        const currentEnrollments = await this.prisma.enrolled_students.findMany({
          where: { class_id: cls.id },
          select: { id: true, student_id: true },
        });
        const currentEnrollMap = new Map(currentEnrollments.map((e) => [e.student_id, e.id]));

        for (const src of sourceEnrollments) {
          const existingEnrollId = currentEnrollMap.get(src.student_id);

          if (existingEnrollId) {
            await this.prisma.enrolled_students.update({
              where: { id: existingEnrollId },
              data: {
                xp: src.xp ?? 0,
                level: src.level ?? 1,
                market_share: src.market_share ?? 0,
                archtype_id: src.archtype_id,
                available_points: src.available_points ?? 0,
                skill_unlocked: src.skill_unlocked ?? true,
              },
            });

            await this.prisma.student_attributes.deleteMany({
              where: { enrollment_id: existingEnrollId },
            });
            if (src.student_attributes.length > 0) {
              await this.prisma.student_attributes.createMany({
                data: src.student_attributes.map((attr) => ({
                  enrollment_id: existingEnrollId,
                  attribute_id: attr.attribute_id,
                  value: attr.value,
                })),
              });
            }

            await this.prisma.student_perks.deleteMany({
              where: { enrollment_id: existingEnrollId },
            });
            if (src.student_perks.length > 0) {
              await this.prisma.student_perks.createMany({
                data: src.student_perks.map((sp) => ({
                  enrollment_id: existingEnrollId,
                  perk_id: sp.perk_id,
                  is_unlocked: sp.is_unlocked,
                  is_used: sp.is_used,
                  is_approved: sp.is_approved,
                  perk_status: sp.perk_status,
                })),
              });
            }
          } else {
            const newEnroll = await this.prisma.enrolled_students.create({
              data: {
                student_id: src.student_id,
                class_id: cls.id,
                xp: src.xp ?? 0,
                level: src.level ?? 1,
                market_share: src.market_share ?? 0,
                archtype_id: src.archtype_id,
                available_points: src.available_points ?? 0,
                skill_unlocked: src.skill_unlocked ?? true,
              },
            });

            if (src.student_attributes.length > 0) {
              await this.prisma.student_attributes.createMany({
                data: src.student_attributes.map((attr) => ({
                  enrollment_id: newEnroll.id,
                  attribute_id: attr.attribute_id,
                  value: attr.value,
                })),
              });
            }

            if (src.student_perks.length > 0) {
              await this.prisma.student_perks.createMany({
                data: src.student_perks.map((sp) => ({
                  enrollment_id: newEnroll.id,
                  perk_id: sp.perk_id,
                  is_unlocked: sp.is_unlocked,
                  is_used: sp.is_used,
                  is_approved: sp.is_approved,
                  perk_status: sp.perk_status,
                })),
              });
            }
          }
        }

        this.logger.log(`Cron: synced data for class ${cls.id} from previous cohort class`);
      } catch (err) {
        this.logger.error(`Cron: failed to sync data for class ${cls.id}`, err);
      }
    }
  }
}
