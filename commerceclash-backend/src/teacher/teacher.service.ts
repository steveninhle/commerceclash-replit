import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GetStudentRequestDto } from '../student/dto/get-student.dto';
import { GetStudentResponseDto } from '../student/dto/get-student-response.dto';
import { PrismaService } from '@utils/prisma/prisma.service';
import { UpdateStudentRequestDto, UpdateStudentResponseDto } from './dto/update-student.dto';
import { GetStudentsForTeacherResponseDto, TeacherStudentDto } from './dto/get-all-student.dto';
import {
  UpdateStudentStatusRequestDto,
  UpdateStudentStatusResponseDto,
} from './dto/update-student-status.dto';
import { SkillsService } from 'src/skills/skills.service';
import { EditSkillRequestDto } from './dto/edit-skill/edit-skill-request.dto';
import { EditSkillResponseDto } from './dto/edit-skill/edit-skill-response.dto';
// import { Prisma } from '@prisma/client';
// import { AddSkillRequestDto } from './dto/add-skill/add-skill-request.dto';
// import { AddSkillResponseDto } from './dto/add-skill/add-skill-response.dto';
import { DeleteSkillResponseDto } from './dto/delete-skill/delete-skill-response.dto';
import { AuthService } from '../auth/auth.service';
import { CreateStudentDto } from './dto/create-student.dto';
@Injectable()
export class TeacherService {
  private readonly logger = new Logger(TeacherService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly skillsService: SkillsService,
    private readonly authService: AuthService,
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

  async createStudent(teacherId: string, dto: CreateStudentDto) {
    const result = await this.authService.signUp({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: dto.password,
    });

    const newStudentId = result.data?.user?.id;
    if (newStudentId) {
      try {
        const now = new Date();

        // Find active class and all future classes (not yet ended)
        let targetClasses = await this.prismaService.renamedclass.findMany({
          where: {
            instructor_id: teacherId,
            end_time: { gte: now },
          },
          select: { id: true, allocated_points: true },
        });

        // Fallback: no active/future classes — use most recently created class
        if (targetClasses.length === 0) {
          const fallbackClass = await this.prismaService.renamedclass.findFirst({
            where: { instructor_id: teacherId },
            orderBy: { created_at: 'desc' },
            select: { id: true, allocated_points: true },
          });
          if (fallbackClass) {
            targetClasses = [fallbackClass];
          }
        }

        if (targetClasses.length > 0) {
          const allAttributes = await this.prismaService.attributes.findMany({
            select: { id: true, value: true },
          });

          for (const targetClass of targetClasses) {
            const enrollment = await this.prismaService.enrolled_students.create({
              data: {
                student_id: newStudentId,
                class_id: targetClass.id,
                available_points: targetClass.allocated_points ?? 10,
              },
              select: { id: true },
            });

            if (allAttributes.length > 0) {
              await this.prismaService.student_attributes.createMany({
                data: allAttributes.map((attr) => ({
                  enrollment_id: enrollment.id,
                  attribute_id: attr.id,
                  value: attr.value ?? 0,
                })),
              });
            }
          }
        }
      } catch (err) {
        this.logger.error(
          `Auto-enrollment failed for student ${newStudentId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return result;
  }

  async getAllStudents(): Promise<GetStudentsForTeacherResponseDto> {
    try {
      const students = await this.prismaService.users.findMany({
        where: { roles: { name: 'student' } },
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
          cohort_students: {
            select: { is_new: true },
            orderBy: { joined_at: 'desc' },
            take: 1,
          },
        },
        orderBy: { created_at: 'asc' },
      });

      if (!students || students.length === 0) {
        return { success: true, message: 'No students found', data: [] };
      }

      const formattedStudents: TeacherStudentDto[] = students.map((student) => ({
        id: student.id,
        name: student.name,
        email: student.email,
        is_active: student.is_active,
        created_at: student.created_at,
        is_new: student.cohort_students[0]?.is_new ?? false,
        enrolled_courses: student.enrolled_students.map((enrollment) => ({
          id: enrollment.Renamedclass.id,
          name: enrollment.Renamedclass.name,
        })),
      }));

      return { success: true, message: 'Students found successfully', data: formattedStudents };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error fetching students: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Error fetching students',
        error: errorMessage,
      });
    }
  }
  async getStudent(dto: GetStudentRequestDto): Promise<GetStudentResponseDto> {
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
        message: 'Student found successfully',
        data: formatted,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error fetching student ${dto.studentId}: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Error fetching student',
        error: errorMessage,
      });
    }
  }
  async updateStudent(
    studentId: string,
    dto: UpdateStudentRequestDto,
  ): Promise<UpdateStudentResponseDto> {
    try {
      const existing = await this.prismaService.users.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          email: true,
          name: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!existing) {
        throw new NotFoundException({
          success: false,
          message: 'Student not found',
          error: 'NOT_FOUND',
        });
      }

      const data: Record<string, any> = {};
      if (dto.name !== undefined) data.name = dto.name;
      if (dto.is_active !== undefined) data.is_active = dto.is_active;
      if (Object.keys(data).length === 0) {
        return {
          success: true,
          message: 'No changes applied',
          data: {
            id: existing.id,
            email: existing.email,
            name: existing.name,
            is_active: existing.is_active,
            created_at: existing.created_at,
            updated_at: existing.updated_at,
          },
        };
      }

      const updated = await this.prismaService.users.update({
        where: { id: studentId },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        },
      });

      return {
        success: true,
        message: 'Student updated successfully',
        data: {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          is_active: updated.is_active,
          created_at: updated.created_at,
          updated_at: updated.updated_at,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error updating student ${studentId}: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Error updating student',
        error: errorMessage,
      });
    }
  }
  async updateStudentStatus(
    studentId: string,
    dto: UpdateStudentStatusRequestDto,
  ): Promise<UpdateStudentStatusResponseDto> {
    try {
      const existing = await this.prismaService.users.findUnique({
        where: { id: studentId },
        select: {
          is_active: true,
        },
      });

      if (!existing) {
        throw new NotFoundException({
          success: false,
          message: 'Student not found',
          error: 'NOT_FOUND',
        });
      }

      const data: Record<string, any> = {};

      if (dto.is_active !== undefined) data.is_active = dto.is_active;
      if (Object.keys(data).length === 0) {
        return {
          success: true,
          message: 'No changes applied',
          data: {
            is_active: existing.is_active,
          },
        };
      }

      const updated = await this.prismaService.users.update({
        where: { id: studentId },
        data,
        select: {
          is_active: true,
        },
      });

      return {
        success: true,
        message: 'Student updated successfully',
        data: {
          is_active: updated.is_active,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error updating student ${studentId}: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Error updating student',
        error: errorMessage,
      });
    }
  }

  // async getSkills(classId: string) {
  //   try {
  //     const skills = await this.skillsService.getAllSkills(classId);
  //     return { success: true, message: 'Skills Fetched Successfully', data: skills };
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     }
  //     const errorMessage = error instanceof Error ? error.message : String(error);
  //     this.logger.error(
  //       `Error finding Skills for class ${classId}: ${errorMessage}`,
  //       error instanceof Error ? error.stack : '',
  //     );
  //     throw new InternalServerErrorException({
  //       success: false,
  //       message: 'Failed to fetch Skills for class',
  //       error: errorMessage,
  //     });
  //   }
  // }

  // async addSkill(classId: string, dto: AddSkillRequestDto): Promise<AddSkillResponseDto> {
  //   try {
  //     const enrollmentIds = await this.checkClass(classId);

  //     const attribute = await this.prismaService.attributes.create({
  //       data: {
  //         name: dto.name,
  //         value: dto.value,
  //         class_id: classId,
  //       },
  //     });

  //     type StudentAttributeWithRelations = Prisma.student_attributesGetPayload<{
  //       include: { attributes: true; enrolled_students: true };
  //     }>;

  //     type FulfilledResult = {
  //       status: 'fulfilled';
  //       enrollmentId: string;
  //       skill: StudentAttributeWithRelations;
  //     };
  //     type RejectedResult = {
  //       status: 'rejected';
  //       enrollmentId: string;
  //       error: unknown;
  //     };
  //     type SettledResult = FulfilledResult | RejectedResult;

  //     const skillPromises: Promise<SettledResult>[] = enrollmentIds.map(({ id }) =>
  //       this.prismaService.student_attributes
  //         .create({
  //           data: {
  //             enrollment_id: id,
  //             attribute_id: attribute.id,
  //             value: dto.value,
  //           },
  //           include: { attributes: true, enrolled_students: true },
  //         })
  //         .then<SettledResult>((skill) => ({
  //           status: 'fulfilled',
  //           enrollmentId: id,
  //           skill,
  //         }))
  //         .catch<SettledResult>((error) => ({
  //           status: 'rejected',
  //           enrollmentId: id,
  //           error,
  //         })),
  //     );

  //     const settledResults = await Promise.all(skillPromises);

  //     const successes = settledResults
  //       .filter((res): res is FulfilledResult => res.status === 'fulfilled')
  //       .map((res) => ({
  //         id: res.skill.attributes.id,
  //         name: res.skill.attributes.name,
  //         value: res.skill.attributes.value,
  //         studentId: res.skill.enrolled_students.student_id,
  //         classId: res.skill.enrolled_students.class_id,
  //         createdAt: res.skill.attributes.created_at,
  //       }));

  //     const errors = settledResults
  //       .filter((res): res is RejectedResult => res.status === 'rejected')
  //       .map((res) => ({
  //         enrollmentId: res.enrollmentId,
  //         reason: res.error instanceof Error ? res.error.message : String(res.error),
  //       }));

  //     return {
  //       success: errors.length === 0,
  //       message: errors.length === 0 ? 'Skill added successfully' : 'Some skills failed to add',
  //       data: successes,
  //       errors,
  //     };
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     }
  //     const errorMessage = error instanceof Error ? error.message : String(error);
  //     this.logger.error(
  //       `Error adding Skills for class ${classId}: ${errorMessage}`,
  //       error instanceof Error ? error.stack : '',
  //     );
  //     throw new InternalServerErrorException({
  //       success: false,
  //       message: 'Failed to add Skills for class',
  //       error: errorMessage,
  //     });
  //   }
  // }

  async editSkill(
    classId: string,
    skillId: string,
    dto: EditSkillRequestDto,
  ): Promise<EditSkillResponseDto> {
    const enrollmentIds = await this.checkClass(classId);

    type SkillResult = Awaited<ReturnType<typeof this.skillsService.editSkills>>;
    type FulfilledResult = { status: 'fulfilled'; enrollmentId: string; skill: SkillResult };
    type RejectedResult = { status: 'rejected'; enrollmentId: string; error: unknown };
    type SettledResult = FulfilledResult | RejectedResult;

    const skillPromises: Promise<SettledResult>[] = enrollmentIds.map(
      ({ id }): Promise<SettledResult> =>
        this.skillsService
          .editSkills(id, skillId, classId, dto.name, dto.value)
          .then((skill): SettledResult => ({ status: 'fulfilled', enrollmentId: id, skill }))
          .catch((error): SettledResult => ({ status: 'rejected', enrollmentId: id, error })),
    );

    const settledResults = await Promise.all(skillPromises);

    const successes = settledResults
      .filter((res): res is FulfilledResult => res.status === 'fulfilled')
      .map((res) => ({
        id: res.skill.id,
        name: res.skill.name,
        value: res.skill.value,
        studentId: res.skill.enrolled_students.student_id,
        classId: res.skill.enrolled_students.class_id,
        updatedAt: res.skill.updated_at,
      }));

    const errors = settledResults
      .filter((res): res is RejectedResult => res.status === 'rejected')
      .map((res) => ({
        enrollmentId: res.enrollmentId,
        reason: res.error instanceof Error ? res.error.message : String(res.error),
      }));

    return {
      success: errors.length === 0,
      message: errors.length === 0 ? 'Skills updated successfully' : 'Some skills failed to update',
      data: successes,
      errors,
    };
  }

  async deleteSkill(classId: string, skillId: string): Promise<DeleteSkillResponseDto> {
    try {
      await this.checkClass(classId);
      await this.skillsService.deleteSkill(skillId);
      return { success: true, message: 'Skill deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error in deleting Skills for class in DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to deleting Skills for DB',
        error: errorMessage,
      });
    }
  }
}
