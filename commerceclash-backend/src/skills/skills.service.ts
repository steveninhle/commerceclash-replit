import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@utils/prisma/prisma.service';
import { isUUID } from 'class-validator';
import { ShiftSkillPointRequest } from 'src/student/dto/shift-skill-points.dto.ts/shift-skill-points-request.dto';

import { effectiveSkillValue, temporaryModifiers } from '../gamification/utils/scenarioEffects';

const MAX_SKILL_VALUE = 8;

type SkillResult = {
  id: string;
  created_at: Date;
  updated_at: Date;
  enrollment_id: string;
  attribute_id: string;
  value: number;
};
@Injectable()
export class SkillsService {
  logger = new Logger(SkillsService.name);
  constructor(private readonly prismaService: PrismaService) {}

  private validationCheck(
    enrollmentId?: string,
    classId?: string,
    studentId?: string,
    skillId?: string,
  ) {
    for (const id of [enrollmentId, classId, studentId, skillId]) {
      if (id && !isUUID(id)) {
        throw new BadRequestException({
          success: false,
          message: `Invalid UUID: ${id}`,
        });
      }
    }
  }

  async editSkills(
    enrollmentId: string,
    skillId: string,
    classId: string,
    name: string | undefined,
    value: number,
  ) {
    this.validationCheck(enrollmentId, classId, skillId);
    try {
      const studentSkill = await this.prismaService.student_attributes.findFirst({
        where: {
          enrollment_id: enrollmentId,
          attribute_id: skillId,
        },
      });

      if (!studentSkill) {
        throw new NotFoundException({
          success: false,
          message: `Skill ${skillId} not found in class ${classId}`,
        });
      }

      const updatedAttribute = await this.prismaService.attributes.update({
        where: { id: skillId },
        data: {
          ...(name !== undefined ? { name } : {}),
          value,
        },
      });

      return {
        ...updatedAttribute,
        enrolled_students: {
          student_id: studentSkill.enrollment_id,
          class_id: classId,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error updating Skills for class ${classId} (enrollment ${enrollmentId}): ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to update Skills for class in DB',
        error: errorMessage,
      });
    }
  }

  async getStudentSkill(enrollmentId: string) {
    this.validationCheck(enrollmentId);
    try {
      const getSkills = await this.prismaService.enrolled_students.findUnique({
        where: { id: enrollmentId },
        select: {
          class_id: true,
          available_points: true,
          skill_unlocked: true,
          is_shifting: true,
          shifting_points: true,
          student_attributes: {
            select: { id: true, value: true, attributes: { select: { name: true } } },
          },
        },
      });

      if (!getSkills) {
        throw new NotFoundException({ success: true, message: 'Enrollments not found' });
      }

      if (getSkills.skill_unlocked === null) {
        throw new BadRequestException({ success: false, message: 'Skill status set to null' });
      }

      const fixedOrder = ['team', 'logistics', 'marketing', 'innovation', 'quality'];

      const modifiers = await temporaryModifiers(this.prismaService, getSkills.class_id);
      const orderedSkills = getSkills.student_attributes
        .map((skill) => ({
          ...skill,
          temporaryValue: modifiers.get(skill.id) ?? 0,
          effectiveValue: effectiveSkillValue(skill.value, modifiers.get(skill.id) ?? 0),
        }))
        .sort((a, b) => {
          const indexA = fixedOrder.indexOf(a.attributes?.name?.toLowerCase());
          const indexB = fixedOrder.indexOf(b.attributes?.name?.toLowerCase());
          return indexA - indexB;
        });
      if (getSkills?.skill_unlocked === null) {
        return { success: false, message: 'Skill status set to null ' };
      }
      const result = {
        orderedSkills: orderedSkills,
        availablePoints: getSkills?.available_points,
        skillUnlocked: getSkills?.skill_unlocked,
        isShifting: getSkills?.is_shifting ?? false,
        shiftingPoints: getSkills?.shifting_points ?? 0,
      };
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error to fetch skills for enrollmentId: ${enrollmentId}: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to fetch Skills for enrollmentId',
        error: errorMessage,
      });
    }
  }

  async updateSkill(
    enrollmentId: string,
    classId: string,
    studentId: string,
    skillId: string,
    value: number,
  ) {
    this.validationCheck(enrollmentId, classId, studentId, skillId);

    try {
      return await this.prismaService.$transaction(async (tx) => {
        // Lock the enrollment row first so concurrent skill saves for the same
        // student serialize here instead of reading the same stale available_points.
        await tx.$executeRaw`SELECT id FROM enrolled_students WHERE id = ${enrollmentId}::uuid FOR UPDATE`;

        const studentSkill = await tx.student_attributes.findUnique({
          where: { id: skillId },
          include: { enrolled_students: { select: { available_points: true } } },
        });

        if (!studentSkill || studentSkill.enrollment_id !== enrollmentId) {
          throw new NotFoundException({
            success: false,
            message: `Skill ${skillId} not found for student ${studentId} in class ${classId}`,
          });
        }

        const availablePoints = studentSkill.enrolled_students?.available_points;

        if (availablePoints == null) {
          throw new NotFoundException({
            success: false,
            message: 'No available or allocated points',
          });
        }

        if (value === studentSkill.value) {
          throw new BadRequestException({
            success: false,
            message: 'New skill value must differ from the current value',
          });
        }

        let newAvailablePoints: number;
        if (value > studentSkill.value) {
          const pointsSpent = value - studentSkill.value;
          if (pointsSpent > availablePoints) {
            throw new BadRequestException({
              success: false,
              message: 'Not enough available points to increase skill to that value',
            });
          }
          newAvailablePoints = availablePoints - pointsSpent;
        } else {
          const pointsReturned = studentSkill.value - value;
          newAvailablePoints = availablePoints + pointsReturned;
        }

        const updatedAttribute = await tx.student_attributes.update({
          where: { id: skillId },
          data: { value },
          select: {
            id: true,
            value: true,
            updated_at: true,
            attributes: { select: { name: true } },
          },
        });

        const updatedEnrollment = await tx.enrolled_students.update({
          where: { id: enrollmentId },
          data: { available_points: newAvailablePoints },
          select: { available_points: true },
        });

        // Signals a skill just crossed into its max value, for perks (e.g.
        // Masterpiece) that react to that moment — not just "is at max".
        const justMaxed =
          studentSkill.value < MAX_SKILL_VALUE && updatedAttribute.value >= MAX_SKILL_VALUE;

        return {
          updatedAttribute,
          available_points: updatedEnrollment.available_points,
          justMaxed,
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error updating skill ${skillId} for student ${studentId} in class ${classId}: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to update skill for student',
        error: errorMessage,
      });
    }
  }

  async resetSkill(classId: string, enrollmentId: string) {
    try {
      const getAllocatedPoints = await this.prismaService.renamedclass.findUnique({
        where: { id: classId },
        select: { allocated_points: true },
      });
      const allocatePoints = getAllocatedPoints?.allocated_points;
      if (allocatePoints == null) {
        throw new NotFoundException({
          success: false,
          message: 'Allocated points for the class not found.',
        });
      }
      await this.prismaService.$transaction([
        this.prismaService.enrolled_students.update({
          where: { id: enrollmentId },
          data: { available_points: allocatePoints },
        }),
        this.prismaService.student_attributes.updateMany({
          where: { enrollment_id: enrollmentId },
          data: { value: 0 },
        }),
      ]);

      const updatedSkills = await this.prismaService.student_attributes.findMany({
        where: { enrollment_id: enrollmentId },
        select: {
          id: true,
          value: true,
          attributes: { select: { name: true } },
          enrolled_students: { select: { available_points: true } },
        },
      });
      return updatedSkills;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error in reseting Skills in DB : ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed in reseting Skills in DB ',
        error: errorMessage,
      });
    }
  }
  async deleteSkill(skillId: string) {
    try {
      const existingSkill = await this.prismaService.attributes.findUnique({
        where: { id: skillId },
      });
      if (!existingSkill) {
        throw new NotFoundException({ success: false, message: 'Skill does not exists' });
      }

      await this.prismaService.attributes.delete({
        where: {
          id: skillId,
        },
      });
      return;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error in deleting Skills in DB : ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed in deleting Skills in DB ',
        error: errorMessage,
      });
    }
  }

  async lockSkills(enrollmentId: string) {
    try {
      const skillstatus = await this.prismaService.enrolled_students.update({
        where: { id: enrollmentId },
        data: { skill_unlocked: false },
      });
      return skillstatus;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException({
          success: false,
          message: `Enrollment with id ${enrollmentId} not found`,
        });
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error in locking skills in DB : ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to update skill status ',
        error: errorMessage,
      });
    }
  }

  async toggleSkillStatus(enrollmentId: string) {
    try {
      // First get current status
      const enrollment = await this.prismaService.enrolled_students.findUnique({
        where: { id: enrollmentId },
        select: { skill_unlocked: true },
      });

      if (!enrollment) {
        throw new NotFoundException({
          success: false,
          message: `Enrollment with id ${enrollmentId} not found`,
        });
      }

      // Toggle the status
      const currentStatus = enrollment.skill_unlocked;
      const newStatus = !currentStatus;
      this.logger.log(
        `Toggling skill status for enrollment ${enrollmentId}: ${currentStatus} -> ${newStatus}`,
      );

      const updatedEnrollment = await this.prismaService.enrolled_students.update({
        where: { id: enrollmentId },
        data: { skill_unlocked: newStatus },
        select: { skill_unlocked: true },
      });

      this.logger.log(`Updated skill status: ${updatedEnrollment.skill_unlocked}`);
      return updatedEnrollment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error toggling skill status in DB : ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to toggle skill status',
        error: errorMessage,
      });
    }
  }

  async toggleClassSkillStatus(classId: string) {
    try {
      // Get all enrollments for this class
      const enrollments = await this.prismaService.enrolled_students.findMany({
        where: { class_id: classId },
        select: { id: true, skill_unlocked: true },
      });

      if (!enrollments || enrollments.length === 0) {
        throw new NotFoundException({
          success: false,
          message: `No enrollments found for class ${classId}`,
        });
      }

      // Determine new status - if any are unlocked, lock all; otherwise unlock all
      const anyUnlocked = enrollments.some((e) => e.skill_unlocked);
      const newStatus = !anyUnlocked;

      this.logger.log(
        `Toggling class ${classId} skills: anyUnlocked=${anyUnlocked}, newStatus=${newStatus}`,
      );

      // Update all enrollments
      await this.prismaService.enrolled_students.updateMany({
        where: { class_id: classId },
        data: { skill_unlocked: newStatus },
      });

      this.logger.log(`Updated all students in class ${classId} to skill_unlocked=${newStatus}`);
      return { skill_unlocked: newStatus };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error toggling class skill status in DB : ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to toggle class skill status',
        error: errorMessage,
      });
    }
  }

  async shiftPoints(
    dto: ShiftSkillPointRequest[],
    skillResult: SkillResult[],
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prismaService; // use provided transaction if available

    // Track running values in-memory so multi-shift sequences that reuse the same
    // skill ID are validated against the post-previous-shift state, not the original.
    const runningValues = new Map(skillResult.map((s) => [s.id, s.value]));

    for (const { fromSkill, toSkill } of dto) {
      const fromValue = runningValues.get(fromSkill);
      const toValue = runningValues.get(toSkill);

      if (fromValue === undefined || toValue === undefined)
        throw new BadRequestException({ success: false, message: 'One or more skills not found' });

      if (fromValue <= 0)
        throw new BadRequestException({
          success: false,
          message: `Cannot shift: ${fromSkill} has 0 or less points`,
        });

      if (toValue >= 8)
        throw new BadRequestException({
          success: false,
          message: `Cannot shift: ${toSkill} already at or above 8`,
        });

      runningValues.set(fromSkill, fromValue - 1);
      runningValues.set(toSkill, toValue + 1);
    }

    // Transactional updates
    for (const { fromSkill, toSkill } of dto) {
      await prisma.student_attributes.update({
        where: { id: fromSkill },
        data: { value: { decrement: 1 } },
      });
      await prisma.student_attributes.update({
        where: { id: toSkill },
        data: { value: { increment: 1 } },
      });
    }

    const updatedIds = dto.flatMap(({ fromSkill, toSkill }) => [fromSkill, toSkill]);
    return prisma.student_attributes.findMany({
      where: { id: { in: updatedIds } },
    });
  }
}
