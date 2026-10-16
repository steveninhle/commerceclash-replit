import { PrismaService } from '@utils/prisma/prisma.service';
import { BadGatewayException, NotFoundException } from '@nestjs/common';

export class BasePerkEffectHelper {
  constructor(protected prisma: PrismaService) {}

  async getEnrollment(studentId: string, classId: string) {
    const enrollment = await this.prisma.enrolled_students.findFirst({
      where: { student_id: studentId, class_id: classId },
    });

    if (!enrollment) {
      throw new BadGatewayException({
        success: false,
        message: 'Student is not enrolled in the specified class',
      });
    }
    return enrollment;
  }

  async getPerkByKey(key: string) {
    const perk = await this.prisma.perks.findUnique({ where: { key } });
    if (!perk)
      throw new NotFoundException({ success: false, message: `Perk '${key}' not found in DB` });
    return perk;
  }

  async getStudentPerk(enrollmentId: string, perkId: string) {
    const studentPerk = await this.prisma.student_perks.findFirst({
      where: { enrollment_id: enrollmentId, perk_id: perkId },
    });

    if (!studentPerk) return null;
    return studentPerk;
  }
  private async checkIsRepeatable(studentPerkId: string) {
    const studentPerk = await this.prisma.student_perks.findUnique({
      where: { id: studentPerkId },
      include: { perks: { include: {} } },
    });
    return studentPerk;
  }

  async markPerkAsUsed(studentPerkId: string) {
    const studentPerk = await this.checkIsRepeatable(studentPerkId);
    if (!studentPerk) {
      throw new NotFoundException({
        success: false,
        message: 'Student perk not found',
      });
    }
    if (studentPerk.perks.is_repeatable) {
      await this.prisma.student_perks.update({
        where: { id: studentPerkId },
        data: {
          is_used: true,
          last_used_at: new Date(),
          next_available_at: new Date(Date.now() + 2 * 60 * 1000),
          is_approved: false,
          perk_status: null,
        },
      });

      return true;
    } else {
      await this.prisma.student_perks.update({
        where: { id: studentPerkId },
        data: {
          is_used: true,
          is_approved: false,
          perk_status: null,
        },
      });

      return true;
    }
  }

  async logPerkUsage(perkId: string, enrollmentId: string, resultData: object) {
    return this.prisma.perk_usage.create({
      data: {
        student_perk_id: perkId,
        enrollment_id: enrollmentId,
        used_at: new Date(),
        result_data: resultData,
      },
    });
  }
}
