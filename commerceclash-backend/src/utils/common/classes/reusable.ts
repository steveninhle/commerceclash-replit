import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@utils/prisma/prisma.service';
import { Enrollment, Perk } from '../types/types';
@Injectable()
export class ReusableService {
  constructor(private readonly prisma: PrismaService) {}
  private logger = new Logger(ReusableService.name);
  async checkEnrollment(classId: string, studentId: string) {
    try {
      const enrollment = await this.prisma.enrolled_students.findFirst({
        where: { class_id: classId, student_id: studentId },
        include: { Renamedclass: { include: {} }, users: { include: {} } },
      });

      if (!enrollment) {
        throw new BadRequestException({ success: false, message: 'Enrollment not found' });
      }
      const result: Enrollment = {
        ...enrollment,
        class: enrollment.Renamedclass,
        user: enrollment.users,
        enrolledStudent: enrollment,
      };
      return result;
    } catch (error) {
      if (error instanceof NotFoundException || BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to fetch enrollment from DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to fetch enrollment from DB',
        error: errorMessage,
      });
    }
  }

  async checkPerk(perkId: string) {
    try {
      const perk = await this.prisma.student_perks.findUnique({
        where: { id: perkId },
        include: { perks: { include: { perk_types: { include: {} } } } },
      });
      if (!perk) {
        throw new BadRequestException({ success: false, message: 'Student Perk not found' });
      }
      const result: Perk = {
        ...perk,
        perk: {
          ...perk.perks,
          perkTypes: perk.perks.perk_types,
          perk: perk.perks,
          autoApprove: perk.perks.auto_approve,
        },
        studentPerk: perk,
      };
      return result;
    } catch (error) {
      if (error instanceof NotFoundException || BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to fetch perk from DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to fetch perk from DB',
        error: errorMessage,
      });
    }
  }
}
