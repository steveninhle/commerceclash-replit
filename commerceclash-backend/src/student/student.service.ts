import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@utils/prisma/prisma.service';

import { GetStudentRequestDto } from './dto/get-student.dto';
import { GetStudentResponseDto } from './dto/get-student-response.dto';
import { GetOwnClassesResponseDto, OwnClassDto } from './dto/get-own-classes.dto';
import { UnenrollResponseDto } from './dto/unenroll-class.dto';
import { SkillsService } from 'src/skills/skills.service';
import { UpsertSkillRequestDto } from './dto/upsert-skill/upsert-skill-request.dto';
import {
  UpsertSkillDataDto,
  UpsertSkillResponseDto,
} from './dto/upsert-skill/upsert-skill-response.dto';
import {
  GetStudentSkillsResponseDto,
  StudentSkillDataDto,
} from './dto/get-student-skills/get-student-skills-response.dto';
import { ResetSkillsResponseDto } from './dto/reset-skills/reset-skills-response.dto';
import { ReusableService } from '@utils/common/classes/reusable';
import { ShiftSkillPointRequest } from './dto/shift-skill-points.dto.ts/shift-skill-points-request.dto';
import { Enrollment } from '@utils/common/types/types';
import { ApiResponse } from '@utils/common/interfaces/interfaces';
import { PointsShiftingResponse, ShiftedSkillsData } from './dto/point-shifting.dto';
import { ClassGateway } from 'src/class/class.gateway';
import { PerkEngine } from 'src/gamification/PerkEngine';
import { provisionStudentPerk } from 'src/gamification/utils/provisionStudentPerk';
import { IPerkEffectContext } from 'src/gamification/core/interfaces/IPerkEffect';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly skillsService: SkillsService,
    private readonly reusable: ReusableService,
    @Inject(forwardRef(() => ClassGateway))
    private readonly classGateway: ClassGateway,
  ) {}
  private async checkClass(classId: string, studentId?: string) {
    try {
      const existingClass = await this.prismaService.renamedclass.findUnique({
        where: { id: classId },
      });
      if (!existingClass) {
        throw new NotFoundException({
          success: false,
          message: `Class ${classId} not found`,
        });
      }

      if (studentId) {
        const enrollment = await this.prismaService.enrolled_students.findFirst({
          where: {
            class_id: classId,
            student_id: studentId,
          },
          select: { id: true },
        });

        if (!enrollment) {
          throw new NotFoundException({
            success: false,
            message: `Student ${studentId} is not enrolled in class ${classId}`,
          });
        }

        return [enrollment];
      }

      const enrollments = await this.prismaService.enrolled_students.findMany({
        where: { class_id: classId },
        select: { id: true },
      });

      if (!enrollments || enrollments.length === 0) {
        throw new NotFoundException({
          success: false,
          message: `No enrolled students found for class ${classId}`,
        });
      }

      return enrollments;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error checking class ${classId}: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to fetch class data',
        error: errorMessage,
      });
    }
  }

  async getProfile(dto: GetStudentRequestDto): Promise<GetStudentResponseDto> {
    try {
      const student = await this.prismaService.users.findUnique({
        where: { id: dto.studentId },
        select: {
          id: true,
          email: true,
          name: true,
          is_active: true,
          created_at: true,
          enrolled_students: {
            include: {
              Renamedclass: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (!student) {
        throw new NotFoundException({
          success: false,
          message: 'Student not found',
          error: 'NOT_FOUND',
        });
      }

      const formatted = {
        id: student.id,
        email: student.email,
        name: student.name,
        is_active: student.is_active,
        created_at: student.created_at,
        enrolled_courses: student.enrolled_students.map((e) => ({
          id: e.Renamedclass.id,
          name: e.Renamedclass.name,
        })),
      };

      return {
        success: true,
        message: 'Student profile fetched successfully',
        data: formatted,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error fetching own student ${dto.studentId}: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Error fetching student profile',
        error: errorMessage,
      });
    }
  }

  async getOwnClasses(studentId: string): Promise<GetOwnClassesResponseDto> {
    try {
      const enrollments = await this.prismaService.enrolled_students.findMany({
        where: { student_id: studentId },
        include: {
          Renamedclass: true,
        },
      });

      const classes: OwnClassDto[] = enrollments.map((e) => ({
        id: e.Renamedclass.id,
        cohort_id: e.Renamedclass.cohort_id,
        meeting_id: e.Renamedclass.meeting_id,
        name: e.Renamedclass.name,
        meeting_link: e.Renamedclass.meeting_link,
        passcode: e.Renamedclass.passcode ?? null,
        duration: e.Renamedclass.duration !== null ? Number(e.Renamedclass.duration) : null,
        instructor_id: e.Renamedclass.instructor_id,
        allocate_points: e.Renamedclass.allocated_points,
        created_at: e.Renamedclass.created_at,
        start_time: e.Renamedclass.start_time ?? null,
        end_time: e.Renamedclass.end_time ?? null,
        status: e.Renamedclass.is_active,
      }));

      const now = new Date();
      const nowMs = now.getTime();
      const activeClass = classes.find(
        (c) =>
          c.start_time != null &&
          c.end_time != null &&
          new Date(c.start_time) <= now &&
          new Date(c.end_time) >= now,
      );
      const nonCompletedClasses = classes.filter(
        (c) => c.end_time == null || new Date(c.end_time) > now,
      );

      const mostRecentCompleted =
        classes
          .filter((c) => c.end_time != null && new Date(c.end_time) <= now)
          .sort((a, b) => new Date(b.end_time!).getTime() - new Date(a.end_time!).getTime())[0] ??
        null;

      const nearest =
        activeClass ??
        nonCompletedClasses
          .filter((c) => c.start_time != null)
          .sort((a, b) => {
            const diffA = Math.abs(new Date(a.start_time!).getTime() - nowMs);
            const diffB = Math.abs(new Date(b.start_time!).getTime() - nowMs);
            return diffA - diffB;
          })[0] ??
        nonCompletedClasses[0] ??
        mostRecentCompleted;

      return {
        success: true,
        message: nearest ? 'Classes found successfully' : 'No enrolled classes',
        data: nearest,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error fetching own classes for student ${studentId}: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Error fetching enrolled classes',
        error: errorMessage,
      });
    }
  }

  async unenrollClass(classId: string, studentId: string): Promise<UnenrollResponseDto> {
    try {
      const existingClass = await this.prismaService.renamedclass.findUnique({
        where: { id: classId },
      });

      if (!existingClass) {
        throw new NotFoundException({
          success: false,
          message: `Class ${classId} does not exist`,
        });
      }

      const enrollment = await this.prismaService.enrolled_students.findFirst({
        where: { student_id: studentId, class_id: classId },
        select: { id: true },
      });

      if (!enrollment) {
        throw new NotFoundException({
          success: false,
          message: `Student ${studentId} is not enrolled in class ${classId}`,
        });
      }

      await this.prismaService.student_attributes.deleteMany({
        where: { enrollment_id: enrollment.id },
      });

      await this.prismaService.enrolled_students.delete({
        where: { id: enrollment.id },
      });

      return {
        success: true,
        message: `Successfully unenrolled from class ${classId}`,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error unerolling class for student ${studentId}: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Error unenrolling class',
        error: errorMessage,
      });
    }
  }

  async getStudentSkills(classId: string, studentId: string): Promise<GetStudentSkillsResponseDto> {
    try {
      const enrollment = await this.checkClass(classId, studentId);
      const enrollmentId = enrollment[0].id;
      const studentsSkills = await this.skillsService.getStudentSkill(enrollmentId);

      if (!('orderedSkills' in studentsSkills)) {
        throw new InternalServerErrorException({
          success: false,
          message: 'Invalid response from getStudentSkill',
        });
      }

      const returningSkills = studentsSkills.orderedSkills.map((skill) => ({
        id: skill.id,
        name: skill.attributes.name,
        value: skill.value,
        temporaryValue: skill.temporaryValue,
        effectiveValue: skill.effectiveValue,
      }));

      const result: StudentSkillDataDto = {
        skills: returningSkills,
        available_points: studentsSkills.availablePoints ?? 0,
        skill_unlocked: studentsSkills.skillUnlocked ?? false,
        is_shifting: studentsSkills.isShifting ?? false,
        shifting_points: studentsSkills.shiftingPoints ?? 0,
      };

      return {
        success: true,
        message: 'Skill fetched Successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error to fetch Skills for student ${studentId} for class ${classId}: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: `Failed to fetch Skills for student ${studentId} for class ${classId}`,
        error: errorMessage,
      });
    }
  }

  async updateSkill(
    classId: string,
    studentId: string,
    skillId: string,
    dto: UpsertSkillRequestDto,
    role: string,
  ): Promise<UpsertSkillResponseDto> {
    try {
      const enrollment = await this.reusable.checkEnrollment(classId, studentId);
      const { id: enrollmentId, skill_unlocked } = enrollment.enrolledStudent;
      const skillUnlocked = Boolean(skill_unlocked);

      if (!skillUnlocked && role !== 'teacher') {
        throw new BadRequestException({ success: false, message: 'Skills are locked' });
      }

      const result = await this.skillsService.updateSkill(
        enrollmentId,
        classId,
        studentId,
        skillId,
        dto.value,
      );

      const data: UpsertSkillDataDto = {
        id: result.updatedAttribute.id,
        name: result.updatedAttribute.attributes.name,
        value: result.updatedAttribute.value,
        available_points: result.available_points,
        updatedAt: result.updatedAttribute.updated_at,
      };

      if (result.justMaxed) {
        await this.triggerMasterpieceForMaxedPillar(
          classId,
          studentId,
          enrollmentId,
          result.updatedAttribute.attributes.name,
        );
      }

      this.classGateway.server.to(classId).emit('skill-updated', {
        type: 'SKILL_UPDATED',
        studentId,
        updates: [{ skillId, value: data.value }],
      });

      return {
        success: true,
        message: 'Skill Updated Successfully',
        data,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error updating skill for student in DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to update skill for student in DB',
        error: errorMessage,
      });
    }
  }

  /**
   * Fires the Masterpiece perk the instant a skill crosses into its max
   * value. This is a bonus side effect of a normal skill update, so a
   * failure here must never break the actual skill update — it's caught and
   * logged instead of thrown.
   */
  private async triggerMasterpieceForMaxedPillar(
    classId: string,
    studentId: string,
    enrollmentId: string,
    maxedSkillName: string,
  ): Promise<void> {
    let reservedPerkId: string | undefined;
    try {
      const provisioned = await provisionStudentPerk(
        this.prismaService,
        enrollmentId,
        'masterpiece',
      );

      if (provisioned.status === 'perk_not_found') {
        this.logger.warn(
          'Masterpiece perk is not seeded in the database yet; skipping auto-grant.',
        );
        return;
      }

      if (provisioned.status !== 'ready') return;

      const { studentPerk } = provisioned;
      reservedPerkId = studentPerk.id;

      const ctx: IPerkEffectContext = {
        student: { id: studentId, name: null, enrollmentId },
        classId,
        perk: { id: studentPerk.id, title: 'Masterpiece' },
        additionalData: { maxedSkillName },
      };

      const result = await PerkEngine.execute('masterpiece', ctx, {
        prisma: this.prismaService,
        classGateway: this.classGateway,
      });

      if (result.success) {
        this.classGateway.emitPerkActivated(studentId, classId, {
          success: true,
          message: result.message,
          data: {
            studentId,
            perkId: studentPerk.id,
            perkTitle: 'Masterpiece',
            perk_status: 'used',
            effects: result.data ?? {},
          },
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to trigger Masterpiece for maxed pillar "${maxedSkillName}": ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
    } finally {
      if (reservedPerkId) {
        await this.prismaService.student_perks
          .updateMany({
            where: { id: reservedPerkId, perk_status: 'pending' },
            data: { perk_status: 'approved', is_approved: true },
          })
          .catch((error: unknown) => {
            this.logger.error(`Failed to release Masterpiece reservation: ${String(error)}`);
          });
      }
    }
  }

  async resetSkills(classId: string, studentId: string): Promise<ResetSkillsResponseDto> {
    try {
      const enrollment = await this.checkClass(classId, studentId);
      const enrollmentId = enrollment[0].id;

      const resetSkills = await this.skillsService.resetSkill(classId, enrollmentId);
      const returningSkills = resetSkills.map((skill) => ({
        id: skill.id,
        name: skill.attributes.name,
        value: skill.value,
        available_points: skill.enrolled_students.available_points,
      }));
      return { success: true, message: 'Skill reset successful', data: returningSkills };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error in reseting Skills for class in DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to reset Skills for DB',
        error: errorMessage,
      });
    }
  }

  async skillsStatus(classId: string, studentId: string): Promise<ApiResponse> {
    try {
      const enrollment = await this.reusable.checkEnrollment(classId, studentId);
      const skillUnlocked = Boolean(enrollment.enrolledStudent.skill_unlocked);
      const response = { skill_unlocked: skillUnlocked };
      const message = response.skill_unlocked ? 'Skills are unlocked' : 'Skills are locked';
      return { success: true, message: message, data: response };
    } catch (error) {
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
        message: 'Failed to lock skills in DB ',
        error: errorMessage,
      });
    }
  }

  async confirmSkills(classId: string, studentId: string) {
    try {
      const enrollment = await this.reusable.checkEnrollment(classId, studentId);
      const lockSkills = await this.skillsService.lockSkills(enrollment.enrolledStudent.id);
      const skillUnlocked = (lockSkills as Record<string, unknown>)['skill_unlocked'];
      if (typeof skillUnlocked !== 'boolean') {
        throw new InternalServerErrorException({
          success: false,
          message: 'Invalid response from lockSkills',
        });
      }
      const data = { skill_unlocked: skillUnlocked };
      return { success: true, message: 'Skills confirmed', data: data };
    } catch (error) {
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
        message: 'Failed to lock skills in DB ',
        error: errorMessage,
      });
    }
  }

  async skillShifting(
    classId: string,
    studentId: string,
    dto: ShiftSkillPointRequest[],
  ): Promise<PointsShiftingResponse> {
    try {
      const enrollment: Enrollment = await this.reusable.checkEnrollment(classId, studentId);
      const enrolledStudent = enrollment.enrolledStudent;

      if (!enrolledStudent.is_shifting) {
        throw new BadRequestException({
          success: false,
          message: 'Skill shifting not allowed by teacher',
        });
      }

      const availableShiftingPoints = enrolledStudent.shifting_points ?? 0;

      if (dto.length > availableShiftingPoints) {
        throw new BadRequestException({
          success: false,
          message: `Number of shift actions (${dto.length}) exceeds available shifting points (${availableShiftingPoints})`,
        });
      }

      // ─────────────────────────────────────────────────────────
      // CASE 1: CONFIRM WITHOUT SHIFT (0 action)
      // ─────────────────────────────────────────────────────────
      if (dto.length === 0) {
        await this.prismaService.enrolled_students.update({
          where: { id: enrolledStudent.id },
          data: {
            shifting_points: 0,
            is_shifting: false,
            skill_unlocked: false,
          },
        });

        // lock state
        this.classGateway.server.to(classId).emit('skills-status-updated', {
          success: true,
          message: `${enrollment.user.name}'s skills are now locked.`,
          data: {
            studentId: enrollment.user.id,
            name: enrollment.user.name,
            skill_unlocked: false,
          },
        });

        // emit batch (empty)
        this.classGateway.server.to(classId).emit('shift-skill', {
          success: true,
          message: 'No shift applied',
          data: {
            studentId: enrollment.user.id,
            updates: [],
            skill_unlocked: false,
          },
        });

        return {
          success: true,
          message: 'Skill shifting confirmed with no changes. Skills are now locked.',
          data: [],
        };
      }

      // ─────────────────────────────────────────────────────────
      // VALIDATE SKILLS
      // ─────────────────────────────────────────────────────────
      const skills = [...new Set(dto.flatMap(({ fromSkill, toSkill }) => [fromSkill, toSkill]))];

      const skillResult = await this.prismaService.student_attributes.findMany({
        where: { id: { in: skills } },
      });

      if (!skillResult.length) {
        throw new BadRequestException({ success: false, message: 'Skills not found' });
      }

      const foundIds = skillResult.map((s) => s.id);
      const missingIds = skills.filter((id) => !foundIds.includes(id));

      if (missingIds.length) {
        throw new BadRequestException({
          success: false,
          message: `Invalid skill IDs: ${missingIds.join(', ')}`,
        });
      }

      if (skillResult.every((s) => s.value >= 8)) {
        throw new BadRequestException({
          success: false,
          message: 'Point shifting not possible: all skills are already at maximum (8)',
        });
      }

      // ─────────────────────────────────────────────────────────
      // TRANSACTION
      // ─────────────────────────────────────────────────────────
      const updatedSkills: ShiftedSkillsData[] = await this.prismaService.$transaction(
        async (tx) => {
          const result = await this.skillsService.shiftPoints(dto, skillResult, tx);

          await tx.enrolled_students.update({
            where: { id: enrolledStudent.id },
            data: {
              shifting_points: 0,
              is_shifting: false,
              skill_unlocked: false,
            },
          });

          return result;
        },
      );

      // ─────────────────────────────────────────────────────────
      // SOCKET EVENTS
      // ─────────────────────────────────────────────────────────

      // 1. lock UI
      this.classGateway.server.to(classId).emit('skills-status-updated', {
        success: true,
        message: `${enrollment.user.name}'s skills are now locked.`,
        data: {
          studentId: enrollment.user.id,
          name: enrollment.user.name,
          skill_unlocked: false,
        },
      });

      // 2. batch skill update (IMPORTANT)
      this.classGateway.server.to(classId).emit('shift-skill', {
        success: true,
        message: 'Skill points shifted successfully',
        data: {
          studentId: enrollment.user.id,
          updates: updatedSkills.map((s) => ({
            skillId: s.id,
            value: s.value,
          })),
          skill_unlocked: false,
        },
      });

      return {
        success: true,
        message: 'Skill points shifted successfully. Skills are now locked.',
        data: updatedSkills,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;

      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Error in skillShifting: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );

      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to shift skill values',
        error: errorMessage,
      });
    }
  }
}
