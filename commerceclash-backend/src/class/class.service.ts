import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
  HttpException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { KJUR } from 'jsrsasign';
import axios, { AxiosResponse } from 'axios';
import { MeetingDataDto, MeetingResponseDto } from './dto/generate-meeting-jwt-response.dto';
import { JoinMeetingRequestDto } from './dto/join-meeting.dto';
import {
  ApiResponse,
  UpdatedStudentXp,
  ZoomMeetingApiResponse,
} from '@utils/common/interfaces/interfaces';
import { ZoomCreateMeetingResponseDto } from './dto/create-meeting/create-meeting-response.dto';
import { AppConfigService } from '@utils/config/config.service';
import { CreateClassRequestDto } from './dto/create-class/create-class.dto';
import {
  CreateClassDataDto,
  CreateClassResponseDto,
} from './dto/create-class/create-class-response.dto';
import { PrismaService } from '@utils/prisma/prisma.service';
import { ZoomRequest } from '@utils/common/guards/zoom-auth.gurad';
import { ClassifiedClassesDto, GetClassResponseDto } from './dto/get-class/get-class-response.dto';
import { GetClassRequestDto } from './dto/get-class/get-class-request.dto';
import {
  GetStudentForClassResponseDto,
  StudentDto,
} from './dto/get-student-for-class/get-student-for-class-response.dto';
import { GetStudentForClassRequestDto } from './dto/get-student-for-class/get-student-for-class-request.dto';
import { ClassGateway } from './class.gateway';
import { perk_status, Prisma, Renamedclass } from '@prisma/client';
import { toggleClassResponse } from './dto/toggle-class-status-response.dto';
import { AssignCeoDto } from './dto/assign-ceo/assign-ceo-request.dto';
import {
  AssignCeoResponseData,
  AssignCeoResponseDto,
} from './dto/assign-ceo/assign-ceo-response.dto';
import { GetCeoResponse, GetCeoResponseData } from './dto/get-ceo/get-ceo-response.dto';
import { CookieOptions, Request, Response } from 'express';
import { PerkEngine } from 'src/gamification/PerkEngine';
import { provisionStudentPerk } from 'src/gamification/utils/provisionStudentPerk';
import { endScenarioEffects } from 'src/gamification/utils/scenarioEffects';
import {
  isNewPerkKey,
  waitsForPerkTrigger,
  requiredPerkLevel,
  isReactiveOnlyPerkKey,
} from 'src/gamification/utils/reactivePerkKeys';
import { IPerkEffectResult } from 'src/gamification/core/interfaces/IPerkEffect';
import {
  StudentXpPair,
  UpdateStudentXpData,
  UpdateStudentXpResponse,
} from './dto/student-xp/update-xp.dto';
import { ReusableService } from '@utils/common/classes/reusable';
import { Enrollment, Perk } from '@utils/common/types/types';
import { PerkApprovalRequest } from './dto/perk-dto/perk-approval-request.dto';
import { MomentOfGloryRequestDto } from './dto/perk-dto/moment-of-glory-perk.dto';
import { TrendsetterRequestDto } from './dto/perk-dto/trendsetter-perk.dto';
import {
  GetStudentsSkills,
  GetStudentsSkillsResponse,
} from './dto/get-students-skills/get-students-skills.dto';
import { DeleteClassResponse } from './dto/delete-class/delete-class.dto';
import {
  StudentAssignedCeoData,
  StudentAssignedCeoResponse,
} from './dto/get-ceo/student-assigned-ceo.dto';
import { GetStudentXpData, GetStudentXpResponse } from './dto/student-xp/get-xp.dto';
import { Parser } from 'json2csv';
import {
  GetStudentMarketShareData,
  GetStudentMarketShareResponse,
} from './dto/class-market-share/get-class-market-share.dto';
import {
  StudentMarketSharePair,
  UpdateStudentMarketShareData,
  UpdateStudentMarketShareResponse,
} from './dto/class-market-share/update-class-market-share.dto';
import { DoubleDown } from 'src/gamification/systems/DoubleDown';
import {
  ClassOverviewStudent,
  GetClassOverviewResponse,
} from './dto/get-class-overview/get-class-overview.dto';

@Injectable()
export class ClassService {
  private readonly apiBaseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly zakCookieOptions: CookieOptions;
  private readonly logger = new Logger(ClassService.name);

  constructor(
    private readonly configService: AppConfigService,
    private readonly prismaService: PrismaService,
    @Inject(forwardRef(() => ClassGateway))
    private readonly classGateway: ClassGateway,
    private readonly resuable: ReusableService,
  ) {
    this.apiBaseUrl = this.configService.zoomApiBaseUrl;
    this.clientId = this.configService.zoomClientId;
    this.clientSecret = this.configService.zoomClientSecret;
    this.zakCookieOptions = this.configService.getZakCookieOptions();
  }

  async getClass(dto: GetClassRequestDto): Promise<GetClassResponseDto> {
    try {
      const { instructorId } = dto;
      const classData = await this.prismaService.renamedclass.findMany({
        where: { instructor_id: instructorId },
      });

      const now = new Date();

      const classified: ClassifiedClassesDto = { active: [], scheduled: [], completed: [] };

      for (const e of classData) {
        const item = {
          // keep types explicit to satisfy ClassDataDto (convert nullable meeting_id to string)
          id: e.id,
          created_at: e.created_at,
          meeting_id: e.meeting_id ?? '',
          name: e.name,
          meeting_link: e.meeting_link ?? '',
          passcode: e.passcode ?? null,
          duration: e.duration !== null ? Number(e.duration) : null,
          instructor_id: e.instructor_id,
          allocated_points: e.allocated_points,
          is_active: e.is_active,
          skill_locked: e.skill_locked,
          start_time: e.start_time ?? null,
          end_time: e.end_time ?? null,
        };
        const start = e.start_time ? new Date(e.start_time) : null;
        const end = e.end_time ? new Date(e.end_time) : null;

        if (start && end && now >= start && now <= end) {
          classified.active.push(item);
        } else if (start && now < start) {
          classified.scheduled.push(item);
        } else if (end && now > end) {
          classified.completed.push(item);
        } else {
          // No start/end time set — treat as scheduled
          classified.scheduled.push(item);
        }
      }

      return {
        success: true,
        message: 'Classes found successfully',
        data: classified,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error class finding class : ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to find class',
        error: errorMessage,
      });
    }
  }

  async getStudentForClass(
    dto: GetStudentForClassRequestDto,
  ): Promise<GetStudentForClassResponseDto> {
    try {
      const classExists = await this.prismaService.renamedclass.findUnique({
        where: { id: dto.classId },
        select: { id: true },
      });

      if (!classExists) {
        throw new NotFoundException({
          success: false,
          message: `Class with ID "${dto.classId}" not found`,
        });
      }

      const enrolled = await this.prismaService.enrolled_students.findMany({
        where: { class_id: dto.classId },
        select: {
          archtype_id: true,
          xp: true,
          level: true,
          users: {
            select: { id: true, email: true, name: true },
          },
          archtypes: { select: { title: true } },
          student_perks: {
            select: {
              id: true,
              is_approved: true,
              is_unlocked: true,
              is_used: true,
              perk_status: true,
              perks: { select: { title: true, description: true } },
            },
          },
        },
        orderBy: { created_at: 'asc' },
      });
      if (enrolled.length === 0) {
        throw new BadRequestException({ success: false, message: 'No students Found for class' });
      }
      const students: StudentDto[] = enrolled.map((data) => ({
        id: data.users.id,
        name: data.users.name,
        email: data.users.email,
        xp: data.xp,
        level: data.level,
        ceo: { id: data.archtype_id, name: data.archtypes?.title ?? '' },
        perks: data.student_perks.map((perk) => ({
          id: perk.id,
          title: perk.perks.title,
          description: perk.perks.description,
          perk_status: perk.perk_status,
          is_unlocked: perk.is_unlocked,
          is_used: perk.is_used,
          is_approved: perk.is_approved,
        })),
      }));

      return {
        success: true,
        message: students.length ? 'Students found successfully' : 'No students enrolled yet',
        data: students,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error finding students for class ${dto.classId}: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to fetch students for class',
        error: errorMessage,
      });
    }
  }

  async createClass(dto: CreateClassRequestDto, userId: string): Promise<CreateClassResponseDto> {
    try {
      const cleanedEnrolled = Array.from(
        new Set((dto.enrolledStudents ?? []).map((id) => id.trim())),
      );

      let validationPromise: Promise<void> | null = null;

      if (cleanedEnrolled.length > 0) {
        validationPromise = (async () => {
          const existing = await this.prismaService.users.findMany({
            where: { id: { in: cleanedEnrolled } },
            select: { id: true },
          });

          const existingSet = new Set(existing.map((u) => u.id));
          const missingIds = cleanedEnrolled.filter((id) => !existingSet.has(id));

          if (missingIds.length > 0) {
            throw new BadRequestException({
              success: false,
              message: 'Invalid enrolledStudents: one or more IDs do not exist',
              error: { missingIds },
            });
          }
        })();
      }

      if (validationPromise) {
        await validationPromise;
      }

      const createClass = await this.prismaService.renamedclass.create({
        data: {
          meeting_id: dto.meetingId,
          name: dto.name,
          meeting_link: dto.meetingLink,
          passcode: dto.passcode,
          duration: dto.duration,
          allocated_points: dto.allocatePoints,
          instructor_id: userId,
          start_time: dto.startTime ? new Date(dto.startTime) : null,
          end_time: dto.endTime ? new Date(dto.endTime) : null,
          cohort_id: dto.cohortId ?? null,
        },
      });

      if (dto.cohortId) {
        await this.prismaService.cohorts.update({
          where: { id: dto.cohortId },
          data: { total_classes: { increment: 1 }, updated_at: new Date() },
        });

        // Find most recent previous class in this cohort to auto-copy student data
        const prevClass = await this.prismaService.renamedclass.findFirst({
          where: { cohort_id: dto.cohortId, id: { not: createClass.id } },
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
                    perks: { select: { key: true } },
                  },
                },
              },
            },
          },
        });

        const sourceEnrollments = prevClass?.enrolled_students ?? [];

        if (sourceEnrollments.length > 0) {
          const sourceMap = new Map(sourceEnrollments.map((e) => [e.student_id, e]));
          const studentsToEnroll =
            cleanedEnrolled.length > 0
              ? cleanedEnrolled
              : sourceEnrollments.map((e) => e.student_id);

          await this.prismaService.enrolled_students.createMany({
            data: studentsToEnroll.map((studentId) => {
              const src = sourceMap.get(studentId);
              return src
                ? {
                    student_id: studentId,
                    class_id: createClass.id,
                    xp: src.xp ?? 0,
                    level: src.level ?? 1,
                    market_share: src.market_share ?? 0,
                    archtype_id: src.archtype_id,
                    available_points: src.available_points ?? dto.allocatePoints ?? 10,
                    skill_unlocked: src.skill_unlocked ?? true,
                  }
                : {
                    student_id: studentId,
                    class_id: createClass.id,
                    available_points: dto.allocatePoints,
                  };
            }),
            skipDuplicates: true,
          });

          const newEnrollments = await this.prismaService.enrolled_students.findMany({
            where: { class_id: createClass.id },
            select: { id: true, student_id: true },
          });
          const enrollmentMap = new Map(newEnrollments.map((e) => [e.student_id, e.id]));

          // Copy skill attributes from source; fresh attributes for brand-new students
          const attributeData = sourceEnrollments.flatMap((src) => {
            const newId = enrollmentMap.get(src.student_id);
            if (!newId) return [];
            return src.student_attributes.map((attr) => ({
              enrollment_id: newId,
              attribute_id: attr.attribute_id,
              value: attr.value,
            }));
          });

          const freshStudentIds = studentsToEnroll.filter((id) => !sourceMap.has(id));
          if (freshStudentIds.length > 0) {
            const allAttributes = await this.prismaService.attributes.findMany({
              select: { id: true, value: true },
            });
            const freshEnrollmentIds = newEnrollments
              .filter((e) => freshStudentIds.includes(e.student_id))
              .map((e) => e.id);
            freshEnrollmentIds.forEach((enrollId) => {
              allAttributes.forEach((attr) => {
                attributeData.push({
                  enrollment_id: enrollId,
                  attribute_id: attr.id,
                  value: attr.value ?? 0,
                });
              });
            });
          }

          if (attributeData.length > 0) {
            await this.prismaService.student_attributes.createMany({ data: attributeData });
          }

          const perkData = sourceEnrollments.flatMap((src) => {
            const newId = enrollmentMap.get(src.student_id);
            if (!newId) return [];
            return src.student_perks.map((sp) => ({
              enrollment_id: newId,
              perk_id: sp.perk_id,
              is_unlocked: sp.is_unlocked,
              is_used: sp.is_used,
              is_approved: isNewPerkKey(sp.perks.key) ? false : sp.is_approved,
              perk_status: isNewPerkKey(sp.perks.key) ? null : sp.perk_status,
            }));
          });
          if (perkData.length > 0) {
            await this.prismaService.student_perks.createMany({ data: perkData });
          }
        } else if (cleanedEnrolled.length > 0) {
          // First class in cohort: fresh enrollment
          await this.prismaService.enrolled_students.createMany({
            data: cleanedEnrolled.map((studentId) => ({
              student_id: studentId,
              class_id: createClass.id,
              available_points: dto.allocatePoints,
            })),
            skipDuplicates: true,
          });

          const enrollments = await this.prismaService.enrolled_students.findMany({
            where: { class_id: createClass.id },
            select: { id: true },
          });
          const allAttributes = await this.prismaService.attributes.findMany({
            select: { id: true, value: true },
          });
          if (allAttributes.length > 0 && enrollments.length > 0) {
            await this.prismaService.student_attributes.createMany({
              data: enrollments.flatMap((enroll) =>
                allAttributes.map((attr) => ({
                  enrollment_id: enroll.id,
                  attribute_id: attr.id,
                  value: attr.value ?? 0,
                })),
              ),
            });
          }
        }
      } else if (cleanedEnrolled.length > 0) {
        // Non-cohort class: fresh enrollment (unchanged)
        await this.prismaService.enrolled_students.createMany({
          data: cleanedEnrolled.map((studentId) => ({
            student_id: studentId,
            class_id: createClass.id,
            available_points: dto.allocatePoints,
          })),
          skipDuplicates: true,
        });

        const enrollments = await this.prismaService.enrolled_students.findMany({
          where: { class_id: createClass.id },
          select: { id: true },
        });

        const allAttributes = await this.prismaService.attributes.findMany({
          select: { id: true, value: true },
        });

        if (allAttributes.length > 0 && enrollments.length > 0) {
          const studentAttributesData = enrollments.flatMap((enroll) =>
            allAttributes.map((attr) => ({
              enrollment_id: enroll.id,
              attribute_id: attr.id,
              value: attr.value ?? 0,
            })),
          );

          await this.prismaService.student_attributes.createMany({
            data: studentAttributesData,
          });
        }
      }

      const newClass: CreateClassDataDto = {
        id: createClass.id,
        created_at: new Date(),
        meeting_id: dto.meetingId,
        name: createClass.name,
        meeting_link: createClass.meeting_link ?? '',
        passcode: createClass.passcode ?? undefined,
        duration: createClass.duration ?? undefined,
        // Ensure explicit numeric (or null) value to avoid unsafe any assignment
        allocate_points:
          createClass.allocated_points != null ? Number(createClass.allocated_points) : null,
        instructor_id: userId,
        enrolled_student: cleanedEnrolled,
        start_time: createClass.start_time ?? null,
        end_time: createClass.end_time ?? null,
      };

      // Notify enrolled students to refetch their class list
      if (cleanedEnrolled.length > 0) {
        try {
          this.classGateway.emitClassListUpdated(cleanedEnrolled);
        } catch (wsError) {
          this.logger.error('Failed to emit class-list-updated after createClass:', wsError);
        }
      }

      return { success: true, message: 'New Class Created', data: newClass };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error creating class: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to create class',
        error: errorMessage,
      });
    }
  }

  async generateMeetingJwt(
    body: JoinMeetingRequestDto,
    req: Request | ZoomRequest,
  ): Promise<MeetingResponseDto> {
    try {
      const getClass = await this.prismaService.renamedclass.findUnique({
        where: { id: body.id },
      });

      if (!getClass) {
        throw new BadRequestException({
          success: false,
          message: `Class with ID "${body.id}" not found.`,
        });
      }

      const now = new Date();
      const startTime = getClass.start_time ? new Date(getClass.start_time) : null;
      const endTime = getClass.end_time ? new Date(getClass.end_time) : null;

      if (startTime && now < startTime && body.role !== 1) {
        throw new BadRequestException({
          success: false,
          message: `Meeting has not started yet. It is scheduled for ${startTime.toISOString()}.`,
        });
      }

      if (endTime && now > endTime) {
        throw new BadRequestException({
          success: false,
          message: 'Meeting has already ended.',
        });
      }

      const expirationSeconds = 7200;
      const iat = Math.floor(Date.now() / 1000);
      const exp = iat + expirationSeconds;

      const oHeader = { alg: 'HS256', typ: 'JWT' };
      const oPayload = {
        appKey: this.clientId,
        sdkKey: this.clientId,
        mn: getClass.meeting_id,
        pwd: getClass.passcode,
        role: body.role,
        iat,
        exp,
        tokenExp: exp,
        video_webrtc_mode: 1,
      };

      const sHeader = JSON.stringify(oHeader);
      const sPayload = JSON.stringify(oPayload);
      const sdkJWT = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, this.clientSecret);

      const data: MeetingDataDto = {
        signature: sdkJWT,
        sdkKey: this.clientId,
      };

      const zoomReq = req as ZoomRequest;
      if (zoomReq.user?.role === 'teacher' && zoomReq.zoomZakToken) {
        data.zak = zoomReq.zoomZakToken;
      }

      return {
        success: true,
        message: 'Signature generated successfully',
        data,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to generate Zoom JWT',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async createMeeting(
    req: ZoomRequest,
    res: Response,
    startTime: string,
  ): Promise<ZoomCreateMeetingResponseDto> {
    try {
      const payload: Record<string, any> = {
        topic: 'Default Meeting',
        type: 2,
        start_time: startTime,
        settings: {
          host_video: true,
          participant_video: true,
        },
        timezone: 'UTC',
        setting: {
          join_before_host: false,
        },
      };

      const userId = req.zoomUser.id;

      const response: AxiosResponse<ZoomMeetingApiResponse> = await axios.post(
        `${this.apiBaseUrl}/users/${userId}/meetings`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${req.zoomToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const { id, join_url, start_url, password } = response.data;
      const startUrl = new URL(start_url);
      const extractedZAK = startUrl.searchParams.get('zak');

      if (extractedZAK) {
        res.cookie('sb_user_zak', extractedZAK, this.zakCookieOptions);
      } else {
        this.logger.warn('ZAK token not found in start_url');
      }

      return {
        success: true,
        message: 'Meeting created successfully',
        data: { meeting_id: String(id), passcode: password, join_url, start_url: start_url },
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Zoom createMeeting error: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to create Zoom meeting',
        error: errorMessage,
      });
    }
  }

  async toggleClassStatus(classId: string, userId: string): Promise<toggleClassResponse> {
    try {
      this.logger.log(`Toggling class status for class ${classId} by instructor ${userId}`);

      const existingClass = await this.prismaService.renamedclass.findFirst({
        where: {
          id: classId,
          instructor_id: userId,
        },
        select: {
          name: true,
          is_active: true,
          instructor_id: true,
        },
      });

      if (!existingClass) {
        this.logger.warn(
          `Class not found or unauthorized access: classId=${classId}, instructorId=${userId}`,
        );
        throw new NotFoundException({
          success: false,
          message: 'Class not found or you are not authorized to modify this class',
        });
      }

      const newStatus = !existingClass.is_active;

      const updatedClass = await this.prismaService.renamedclass.update({
        where: { id: classId },
        data: { is_active: newStatus },
        select: { is_active: true },
      });

      this.logger.log(`Class ${classId} status updated to ${newStatus ? 'active' : 'inactive'}`);

      try {
        this.classGateway.emitClassStatus(classId, existingClass.name, updatedClass.is_active);
      } catch (wsError) {
        this.logger.error(`Failed to emit WebSocket event for class ${classId}:`, wsError);
      }

      return {
        success: true,
        message: `Class Status Updated ${updatedClass.is_active}`,
        data: { is_active: updatedClass.is_active },
      };
    } catch (error: unknown) {
      this.logger.error(`Error toggling class status for class ${classId}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException({
            success: false,
            message: 'Class not found',
          });
        }

        if (error.code === 'P2002') {
          throw new NotFoundException({
            success: false,
            message: 'Database constraint violation',
          });
        }
      }
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error updating class status: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to update class status',
        error: errorMessage,
      });
    }
  }

  async getCeo(classId: string): Promise<GetCeoResponse> {
    try {
      const existingClass = await this.prismaService.renamedclass.findUnique({
        where: { id: classId },
      });
      if (!existingClass) {
        throw new NotFoundException({ success: false, message: 'Class not exists' });
      }
      const archetypes = await this.prismaService.archtypes.findMany({
        select: {
          id: true,
          title: true,
          sub_title: true,
          perks: true,
        },
      });
      const result: GetCeoResponseData[] = archetypes.map((e) => {
        return {
          id: e.id,
          title: e.title,
          sub_title: e.sub_title,
          perks: e.perks.map((detail) => {
            return { id: detail.id, title: detail.title, description: detail.description };
          }),
        };
      });
      return { success: true, message: 'Ceo Fetch successfully', data: result };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to fetch CEO from DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to fetch CEO from DB',
        error: errorMessage,
      });
    }
  }

  async enrollStudent(
    classId: string,
    studentId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const existing = await this.prismaService.enrolled_students.findFirst({
        where: { student_id: studentId, class_id: classId },
      });

      if (existing) {
        return { success: true, message: 'Student already enrolled in this class' };
      }

      const enrollment = await this.prismaService.enrolled_students.create({
        data: { student_id: studentId, class_id: classId },
      });

      // Without this, the enrollment has no student_attributes rows and the
      // TEAM/QUALITY/MARKETING/LOGISTICS/INNOVATION cells in the teacher's
      // manage-class table render permanently disabled for this student,
      // regardless of the skill_unlocked toggle.
      const allAttributes = await this.prismaService.attributes.findMany({
        select: { id: true, value: true },
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

      return { success: true, message: 'Student enrolled successfully' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error enrolling student',
        error: errorMessage,
      });
    }
  }

  async assignCeo(
    classId: string,
    studentId: string,
    dto: AssignCeoDto,
  ): Promise<AssignCeoResponseDto> {
    try {
      const enrollment = await this.prismaService.enrolled_students.findFirst({
        where: { student_id: studentId, class_id: classId },
      });

      if (!enrollment) {
        throw new NotFoundException({ success: false, message: 'Enrollment not found' });
      }

      const isSameCeo = enrollment.archtype_id === dto.ceoId;

      const assignCeo = await this.prismaService.enrolled_students.update({
        where: { id: enrollment.id },
        data: { archtype_id: dto.ceoId },
        select: { xp: true, level: true, archtypes: { select: { title: true, sub_title: true } } },
      });

      if (!assignCeo) {
        throw new InternalServerErrorException({
          success: false,
          message: `Failed to assign ceo to student`,
        });
      }

      if (!isSameCeo) {
        await this.prismaService.student_perks.deleteMany({
          where: { enrollment_id: enrollment.id },
        });

        const archetype_perks = await this.prismaService.perks.findMany({
          where: {
            archtype_id: dto.ceoId,
          },
        });

        await this.prismaService.student_perks.createMany({
          data: archetype_perks.map((perk) => ({
            enrollment_id: enrollment.id,
            perk_id: perk.id,
            is_unlocked: false,
            is_used: false,
            perk_status: null,
          })),
        });
      }

      // Fetch the newly created student_perks with perk_types to check auto-unlock conditions
      const studentPerks = await this.prismaService.student_perks.findMany({
        where: { enrollment_id: enrollment.id },
        orderBy: { perks: { perk_types: { type: 'asc' } } },
        select: {
          id: true,
          is_unlocked: true,
          is_used: true,
          is_approved: true,
          perk_status: true,
          perks: {
            select: {
              title: true,
              key: true,
              description: true,
              perk_types: { select: { type: true } },
            },
          },
        },
      });

      // Auto-unlock perks based on current XP: core at 20 XP, ultra at 40 XP
      const currentXp = assignCeo.xp ?? 0;
      const perksToAutoUnlock = studentPerks.filter((sp) => {
        const type = sp.perks.perk_types.type.toLowerCase();
        return (type === 'core' && currentXp >= 20) || (type === 'ultra' && currentXp >= 40);
      });

      if (perksToAutoUnlock.length > 0) {
        await Promise.all(
          perksToAutoUnlock.map((sp) =>
            this.prismaService.student_perks.update({
              where: { id: sp.id },
              data: { is_unlocked: true },
            }),
          ),
        );
        // Mark them as unlocked in our local array too
        perksToAutoUnlock.forEach((sp) => {
          sp.is_unlocked = true;
        });
      }

      const result: AssignCeoResponseData = {
        archetype: {
          id: dto.ceoId,
          title: assignCeo.archtypes?.title ?? '',
          sub_title: assignCeo.archtypes?.sub_title ?? '',
        },
        xp: assignCeo.xp,
        level: assignCeo.level,
        perks: studentPerks.map((sp) => ({
          id: sp.id,
          title: sp.perks.title,
          key: sp.perks.key,
          description: sp.perks.description,
          is_unlocked: sp.is_unlocked,
          is_used: sp.is_used,
          is_approved: sp.is_approved,
          perk_status: sp.perk_status,
          perk_type: sp.perks.perk_types.type ?? null,
        })),
      };

      this.classGateway.emitAssignCeo(studentId, result, classId);

      // Also update the leaderboard so CEO change is reflected there
      const allEnrollments = await this.prismaService.enrolled_students.findMany({
        where: { class_id: classId },
        select: {
          id: true,
          student_id: true,
          market_share: true,
          archtype_id: true,
          archtypes: { select: { title: true } },
          users: { select: { name: true } },
        },
      });

      this.classGateway.emitLeaderboardUpdated(
        classId,
        allEnrollments.map((e) => ({
          id: e.student_id,
          name: e.users?.name ?? null,
          marketShare: e.market_share,
          ceo: { id: e.archtype_id ?? null, title: e.archtypes?.title ?? null },
        })),
      );

      return { success: true, message: `CEO assigned successfully`, data: result };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to update data in DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to assign archetype/ceo at DB',
        error: errorMessage,
      });
    }
  }

  async getStudentsSkills(classId: string): Promise<GetStudentsSkillsResponse> {
    try {
      // Single query: fetch class + all enrollments + all student_attributes together
      const existingClass = await this.prismaService.renamedclass.findUnique({
        where: { id: classId },
        select: {
          allocated_points: true,
          enrolled_students: {
            orderBy: { users: { name: 'asc' } },
            select: {
              id: true,
              student_id: true,
              skill_unlocked: true,
              users: { select: { name: true } },
              student_attributes: {
                select: {
                  id: true,
                  value: true,
                  attributes: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      if (!existingClass) {
        throw new NotFoundException({ success: false, message: 'Class not found' });
      }

      if (existingClass.enrolled_students.length === 0) {
        return { success: true, message: 'No students assigned to class' };
      }

      const fixedOrder = ['team', 'logistics', 'marketing', 'innovation', 'quality'];
      const studentsWithSkills: GetStudentsSkills[] = existingClass.enrolled_students.map(
        (enrolled) => {
          const skills = enrolled.student_attributes
            .map((s) => ({
              id: s.id,
              label: s.attributes.name,
              value: s.value,
            }))
            .sort(
              (a, b) =>
                fixedOrder.indexOf(a.label.toLowerCase()) -
                fixedOrder.indexOf(b.label.toLowerCase()),
            );

          return {
            id: enrolled.student_id,
            name: enrolled.users?.name || null,
            max: existingClass.allocated_points,
            skill_unlocked: enrolled.skill_unlocked ?? true,
            skills,
          };
        },
      );

      return {
        success: true,
        message: 'Students skills fetched successfully',
        data: studentsWithSkills,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to fetch students Skills from DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to fetch students skills from DB',
        error: errorMessage,
      });
    }
  }

  async deleteClass(classId: string): Promise<DeleteClassResponse> {
    try {
      const existingClass: Renamedclass | null = await this.prismaService.renamedclass.findUnique({
        where: { id: classId },
        include: { enrolled_students: { select: { student_id: true } } },
      });

      if (!existingClass) {
        throw new BadRequestException({
          success: false,
          message: 'Class not found',
        });
      }

      const enrolledStudentIds = (
        existingClass as Renamedclass & { enrolled_students: { student_id: string }[] }
      ).enrolled_students.map((e) => e.student_id);

      await this.prismaService.renamedclass.delete({
        where: { id: classId },
      });

      // Notify enrolled students to refetch their class list
      if (enrolledStudentIds.length > 0) {
        try {
          this.classGateway.emitClassListUpdated(enrolledStudentIds);
        } catch (wsError) {
          this.logger.error('Failed to emit class-list-updated after deleteClass:', wsError);
        }
      }

      return { success: true, message: 'Class deleted Successfully' };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to delete class from DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to delete class from DB',
        error: errorMessage,
      });
    }
  }

  async getAssignedCeo(classId: string, studentId: string): Promise<StudentAssignedCeoResponse> {
    try {
      const existingClass: Renamedclass | null = await this.prismaService.renamedclass.findUnique({
        where: {
          id: classId,
        },
      });

      if (!existingClass) {
        throw new BadRequestException({
          success: false,
          message: 'Class not found',
        });
      }

      const assignedCeo = await this.prismaService.enrolled_students.findFirst({
        where: { class_id: classId, student_id: studentId },
        select: {
          archtype_id: true,
          xp: true,
          level: true,
          archtypes: { select: { title: true, sub_title: true } },
          student_perks: {
            orderBy: {
              perks: { perk_types: { type: 'asc' } },
            },
            select: {
              id: true,
              is_approved: true,
              is_unlocked: true,
              is_used: true,
              next_available_at: true,
              perk_status: true,
              perks: {
                select: {
                  title: true,
                  description: true,
                  key: true,
                  is_repeatable: true,
                  perk_types: { select: { type: true } },
                },
              },
            },
          },
        },
      });

      if (!assignedCeo) {
        throw new BadRequestException({ success: false, message: 'Enrollment not found' });
      }
      // Log perk keys for debugging
      this.logger.log(
        `[getAssignedCeo] Perk keys for student ${studentId}: ${assignedCeo.student_perks.map((p) => p.perks.key).join(', ')}`,
      );

      const result: StudentAssignedCeoData = {
        id: assignedCeo.archtype_id,
        title: assignedCeo.archtypes?.title,
        sub_title: assignedCeo.archtypes?.sub_title,
        xp: assignedCeo.xp,
        level: assignedCeo.level,
        // All CEO perks are visible so students can request teacher approval.
        perks: assignedCeo.student_perks.map((e) => {
          return {
            id: e.id,
            title: e.perks.title,
            description: e.perks.description,
            is_approved: e.is_approved,
            is_unlocked: e.is_unlocked,
            is_used:
              e.is_used &&
              !(
                isNewPerkKey(e.perks.key) &&
                e.perks.is_repeatable &&
                e.next_available_at &&
                e.next_available_at <= new Date()
              ),
            perk_status: e.perk_status,
            key: e.perks.key,
            perk_type: e.perks.perk_types?.type ?? null,
          };
        }),
      };
      return { success: true, message: 'Ceo Fetched Successfully', data: result };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to fetch CEO from DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to fetch CEO from DB',
        error: errorMessage,
      });
    }
  }

  async getEspionageSkillTrees(classId: string, studentId: string): Promise<ApiResponse> {
    try {
      const enrollment = await this.resuable.checkEnrollment(classId, studentId);
      const espionagePerk = await this.prismaService.student_perks.findFirst({
        where: {
          enrollment_id: enrollment.enrolledStudent.id,
          perks: { key: 'corporate_espionage' },
          is_used: true,
        },
        include: { perk_usage: { orderBy: { used_at: 'desc' }, take: 1 } },
      });

      if (!espionagePerk || espionagePerk.perk_usage.length === 0) {
        return { success: false, message: 'No Corporate Espionage usage found' };
      }

      const resultData = espionagePerk.perk_usage[0].result_data as Record<string, unknown>;
      const skillTrees = resultData?.skillTrees ?? null;

      return { success: true, message: 'Espionage data retrieved', data: { skillTrees } };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException({ success: false, message: errorMessage });
    }
  }

  async usePerk(
    classId: string,
    studentId: string,
    perkId: string,
    additionalData?: Record<string, unknown>,
  ): Promise<ApiResponse> {
    try {
      const [enrollment, perk] = await Promise.all([
        this.resuable.checkEnrollment(classId, studentId),
        this.resuable.checkPerk(perkId),
      ]);

      if (isReactiveOnlyPerkKey(perk.perk.perk.key)) {
        throw new BadRequestException({
          success: false,
          message: `"${perk.perk.perk.title}" triggers automatically and cannot be activated manually.`,
        });
      }

      const perkType = perk.perk.perkTypes.type.toLowerCase();
      const ctx = {
        student: {
          id: studentId,
          name: enrollment.user.name ?? '',
          enrollmentId: enrollment.enrolledStudent.id,
        },
        teacherId: enrollment.class.instructor_id,
        classId,
        perk: { id: perkId, title: perk.perk.perk.title },
        additionalData,
      };

      const currentLevel: number | null = enrollment.enrolledStudent.level ?? 1;
      const sp = perk.studentPerk;

      if (!sp.is_unlocked) {
        throw new BadRequestException({ success: false, message: 'Perk is not unlocked yet' });
      }

      if (
        sp.is_used &&
        sp.is_approved === false &&
        sp.perk_status === 'pending' &&
        perk.perk.perk.is_repeatable &&
        sp.next_available_at &&
        new Date(sp.next_available_at) <= new Date()
      ) {
        await this.prismaService.student_perks.update({
          where: { id: sp.id },
          data: { is_approved: false, perk_status: 'pending' },
        });

        const approvalData: PerkApprovalRequest = {
          student: { id: studentId, name: enrollment.user.name },
          classId,
          teacherId: enrollment.class.instructor_id,
          perk: { id: sp.id, title: perk.perk.perk.title },
        };
        this.classGateway.emitPerkApprovalRequest(approvalData);

        return {
          success: false,
          message: `Repeatable perk available again; approval requested from teacher.`,
        };
      }

      if (!sp.is_approved) {
        throw new BadRequestException({
          success: false,
          message: 'Perk is not approved by teacher',
        });
      }

      if (sp.is_used) {
        throw new BadRequestException({
          success: false,
          message: 'Perk has already been used',
        });
      }

      switch (perkType) {
        case 'core':
          if (currentLevel >= 3) {
            // Core perk available at 20 XP (Level 3)
            const success = await PerkEngine.execute(perk.perk.perk.key, ctx, {
              prisma: this.prismaService,
              classGateway: this.classGateway,
            });
            this.classGateway.emitPerkUsed(ctx);
            return success;
          }
          break;
        case 'ultra':
          if (currentLevel >= 5) {
            // Ultra perk available at 40 XP (Level 5)
            const success = await PerkEngine.execute(perk.perk.perk.key, ctx, {
              prisma: this.prismaService,
              classGateway: this.classGateway,
            });

            this.classGateway.emitPerkUsed(ctx);
            return success;
          }
          break;
        default:
          break;
      }
      return {
        success: false,
        message: 'Perk cannot be used at the current level or type is invalid.',
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to apply perk: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to apply perk at DB',
        error: errorMessage,
      });
    }
  }

  async updatePerk(perkId: string, status: perk_status) {
    try {
      // When denying, reset to request state; otherwise approve
      const updateData =
        status === 'denied'
          ? { is_approved: false, is_used: false, perk_status: null }
          : { is_approved: true, is_used: false, perk_status: status };

      const perk = await this.prismaService.student_perks.update({
        where: { id: perkId },
        data: updateData,
      });
      return perk;
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to update perk status in DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to update perk status in DB',
        error: errorMessage,
      });
    }
  }

  async decideNewPerk(
    classId: string,
    studentId: string,
    perkId: string,
    approved: boolean,
  ): Promise<ApiResponse> {
    const enrollment = await this.resuable.checkEnrollment(classId, studentId);
    const sp = await this.prismaService.student_perks.findUnique({
      where: { id: perkId },
      include: { perks: { include: { perk_types: true } } },
    });
    if (
      !sp ||
      !isNewPerkKey(sp.perks.key) ||
      sp.enrollment_id !== enrollment.enrolledStudent.id ||
      !sp.is_unlocked ||
      sp.perk_status !== 'pending' ||
      sp.is_approved ||
      enrollment.enrolledStudent.archtype_id !== sp.perks.archtype_id ||
      (enrollment.enrolledStudent.level ?? 1) < requiredPerkLevel(sp.perks.perk_types.type) ||
      (sp.is_used &&
        (!sp.perks.is_repeatable || !sp.next_available_at || sp.next_available_at > new Date()))
    ) {
      throw new BadRequestException('This perk has no eligible pending approval request.');
    }
    const decision = await this.prismaService.student_perks.updateMany({
      where: { id: perkId, perk_status: 'pending', is_approved: false },
      data: {
        is_approved: approved,
        perk_status: approved ? 'approved' : 'denied',
        ...(approved ? { is_used: false } : {}),
      },
    });
    if (decision.count !== 1)
      throw new BadRequestException('This request has already been decided.');
    if (!approved)
      return { success: true, message: 'Perk denied.', data: { perk_status: 'denied' } };
    if (waitsForPerkTrigger(sp.perks.key)) {
      return {
        success: true,
        message: 'Perk approved; waiting for its gameplay trigger.',
        data: { waitingForTrigger: true, pendingCompletion: true },
      };
    }
    return this.activatePerkAfterApproval(classId, studentId, perkId);
  }

  async activatePerkAfterApproval(
    classId: string,
    studentId: string,
    perkId: string,
    additionalData?: Record<string, unknown>,
    triggered = false,
  ): Promise<ApiResponse> {
    let perkStatusUpdated = false;
    let enrollment: Enrollment | null = null;
    let perk: Perk | null = null;

    try {
      this.logger.log(
        `Activating perk after approval: classId=${classId}, studentId=${studentId}, perkId=${perkId}`,
      );

      // Get enrollment and perk information
      enrollment = await this.resuable.checkEnrollment(classId, studentId);
      perk = await this.resuable.checkPerk(perkId);

      if (isNewPerkKey(perk.perk.perk.key)) {
        const sp = perk.studentPerk;
        if (
          sp.enrollment_id !== enrollment.enrolledStudent.id ||
          !sp.is_unlocked ||
          !sp.is_approved ||
          (sp.perk_status !== 'approved' && !triggered)
        ) {
          throw new BadRequestException(
            'Teacher approval is required before this perk can take effect.',
          );
        }
        if (waitsForPerkTrigger(perk.perk.perk.key) && !triggered) {
          if (
            !additionalData?.targetStudentId ||
            !['star_power', 'extortion'].includes(perk.perk.perk.key)
          ) {
            throw new BadRequestException('This approved perk must wait for its gameplay trigger.');
          }
          const latest = await this.prismaService.perk_usage.findFirst({
            where: { student_perk_id: perkId },
            orderBy: { used_at: 'desc' },
          });
          const data = latest?.result_data as Record<string, unknown> | null;
          if (data?.pendingCompletion !== true) {
            throw new BadRequestException('Trigger this perk before choosing a target.');
          }
        }
      }

      // These effects own their status and ledger transaction. The generic
      // rollback must never reset a concurrently completed one-shot perk.
      if (['afterburner', 'extortion', 'insider_trading'].includes(perk.perk.perk.key)) {
        const result = await PerkEngine.execute(
          perk.perk.perk.key,
          {
            student: {
              id: studentId,
              name: enrollment.user.name ?? '',
              enrollmentId: enrollment.enrolledStudent.id,
            },
            classId,
            perk: { id: perkId, title: perk.perk.perk.title },
            additionalData,
          },
          { prisma: this.prismaService, classGateway: this.classGateway },
        );
        return { ...result, data: result.data as Record<string, unknown> | undefined };
      }

      if (!isNewPerkKey(perk.perk.perk.key)) {
        // Update perk status to "approved" (is_used will be set by markPerkAsUsed after effect completes)
        await this.prismaService.student_perks.update({
          where: { id: perkId },
          data: {
            is_approved: true,
            perk_status: 'approved',
          },
        });
        perkStatusUpdated = true;
      }

      // Execute perk effects through PerkEngine
      const perkKey = perk.perk.perk.key;
      this.logger.log(
        `[activatePerkAfterApproval] Executing perk with key: "${perkKey}", title: "${perk.perk.perk.title}"`,
      );
      this.logger.log(
        `[activatePerkAfterApproval] additionalData: ${JSON.stringify(additionalData)}`,
      );

      const ctx = {
        student: {
          id: studentId,
          name: enrollment.user.name ?? '',
          enrollmentId: enrollment.enrolledStudent.id,
        },
        teacherId: enrollment.class.instructor_id,
        classId,
        perk: { id: perkId, title: perk.perk.perk.title },
        additionalData,
      };

      // Wrap PerkEngine.execute in try-catch for better error handling
      let result: IPerkEffectResult;
      try {
        result = await PerkEngine.execute(perkKey, ctx, {
          prisma: this.prismaService,
          classGateway: this.classGateway,
        });
      } catch (perkEngineError: unknown) {
        const engineErrorMsg =
          perkEngineError instanceof Error ? perkEngineError.message : String(perkEngineError);
        const engineErrorStack = perkEngineError instanceof Error ? perkEngineError.stack : '';
        this.logger.error(`PerkEngine execution failed for key "${perkKey}": ${engineErrorMsg}`);
        this.logger.error(`PerkEngine stack trace: ${engineErrorStack}`);
        throw new Error(`Perk effect execution failed: ${engineErrorMsg}`);
      }

      this.logger.log(
        `[activatePerkAfterApproval] Perk activated successfully: ${perk.perk.perk.title}`,
      );
      this.logger.log(`[activatePerkAfterApproval] Result data: ${JSON.stringify(result.data)}`);

      // If the perk effect returned a soft failure (condition not met), reset perk status
      if (!result.success && !isNewPerkKey(perk.perk.perk.key)) {
        await this.prismaService.student_perks.update({
          where: { id: perkId },
          data: { is_approved: false, perk_status: 'pending' },
        });
      }

      return {
        success: result.success,
        message: result.message ?? `Perk "${perk.perk.perk.title}" activated successfully`,
        data: (result.data ?? undefined) as Record<string, unknown> | undefined,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to activate perk after approval: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );

      // Rollback perk status if activation fails and status was updated
      if (perkStatusUpdated) {
        try {
          await this.prismaService.student_perks.update({
            where: { id: perkId },
            data: {
              is_used: false,
              is_approved: false,
              perk_status: 'pending',
            },
          });
          this.logger.log(`Rolled back perk status after activation failure`);
        } catch (rollbackError) {
          this.logger.error(
            `Failed to rollback perk status: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
          );
        }
      }

      // Re-throw with detailed error information
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to activate perk after approval',
        error: errorMessage,
      });
    }
  }

  /** Reserves an approved reactive perk and applies its gameplay trigger. */
  private async provisionAndActivateReactivePerk(
    classId: string,
    studentId: string,
    perkKey: string,
    additionalData: Record<string, unknown> = {},
  ): Promise<ApiResponse> {
    const enrollment = await this.resuable.checkEnrollment(classId, studentId);

    const provisioned = await provisionStudentPerk(
      this.prismaService,
      enrollment.enrolledStudent.id,
      perkKey,
    );

    if (provisioned.status === 'perk_not_found') {
      throw new NotFoundException({
        success: false,
        message: `Perk "${perkKey}" is not seeded in the database yet.`,
      });
    }

    if (provisioned.status === 'archetype_mismatch') {
      return {
        success: false,
        message: `Perk "${perkKey}" does not belong to this student's CEO archetype.`,
      };
    }

    if (provisioned.status === 'unavailable') {
      return {
        success: false,
        message: `Perk "${perkKey}" is currently unavailable.`,
        data: {
          perkId: provisioned.studentPerk.id,
          nextAvailableAt: provisioned.studentPerk.next_available_at,
        },
      };
    }

    const { studentPerk } = provisioned;

    const releaseReservation = () =>
      this.prismaService.student_perks.updateMany({
        where: { id: studentPerk.id, is_approved: true },
        data: { perk_status: 'approved', is_approved: true },
      });
    let activation: ApiResponse;
    try {
      activation = await this.activatePerkAfterApproval(
        classId,
        studentId,
        studentPerk.id,
        additionalData,
        true,
      );
      if (
        activation.success &&
        (activation.data as Record<string, unknown> | undefined)?.pendingCompletion
      ) {
        await this.prismaService.perk_usage.create({
          data: {
            student_perk_id: studentPerk.id,
            enrollment_id: enrollment.enrolledStudent.id,
            used_at: new Date(),
            result_data: { perkKey, pendingCompletion: true },
          },
        });
        await releaseReservation();
      }
      if (!activation.success) await releaseReservation();
    } catch (error) {
      await releaseReservation();
      throw error;
    }

    const activationData = (activation.data ?? {}) as Record<string, unknown>;

    return {
      success: activation.success,
      message: activation.message,
      data: { ...activationData, perkId: studentPerk.id },
    };
  }

  /**
   * Triggers the Spotlight perk automatically when a task is scored Elite.
   *
   * There is no task-grading system yet, so this is called directly (e.g. from
   * a test button) with the score that would otherwise come from that system.
   * Spotlight requires no manual activation/approval — it reacts to the score.
   */
  /** Development test page entry point; gateway checks the prototype session first. */
  async triggerApprovedPerkForTest(
    classId: string,
    studentId: string,
    perkKey: string,
    predictedType?: string,
  ): Promise<ApiResponse> {
    if (!isReactiveOnlyPerkKey(perkKey)) {
      throw new BadRequestException('This perk has no simulated gameplay trigger.');
    }
    if (
      perkKey === 'prophecy' &&
      !['market', 'crisis', 'opportunity', 'challenge'].includes(predictedType ?? '')
    ) {
      throw new BadRequestException('Choose a valid scenario prediction.');
    }
    return this.provisionAndActivateReactivePerk(classId, studentId, perkKey, {
      ...(perkKey === 'prophecy' ? { predictedType } : {}),
      ...(perkKey === 'masterpiece' ? { maxedSkillName: 'Test pillar' } : {}),
    });
  }

  async triggerSpotlightForEliteScore(classId: string, studentId: string): Promise<ApiResponse> {
    try {
      return await this.provisionAndActivateReactivePerk(classId, studentId, 'spotlight');
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to trigger Spotlight for Elite score: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to trigger Spotlight perk',
        error: errorMessage,
      });
    }
  }

  /**
   * Triggers the Star Power perk automatically when a task is scored Elite.
   *
   * Same reasoning as Spotlight above — called directly until the real
   * task-grading system exists. This only runs Phase 1 (no target yet); the
   * student then picks a rival to steal from via the existing
   * 'perk-complete-with-target' flow, same as Sabotage/Trendsetter/Danger Zone.
   */
  async triggerStarPowerForEliteScore(classId: string, studentId: string): Promise<ApiResponse> {
    try {
      return await this.provisionAndActivateReactivePerk(classId, studentId, 'star_power');
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to trigger Star Power for Elite score: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to trigger Star Power perk',
        error: errorMessage,
      });
    }
  }

  /**
   * Resolves a Prophecy prediction submitted at the start of the scenario
   * phase. There is no scenario system yet, so this is called directly
   * (e.g. from a test button) with the predicted type; Prophecy.ts compares
   * it against the shared UPCOMING_SCENARIO_TYPE placeholder until the real
   * scenario draw exists to supply it.
   */
  async triggerProphecyPrediction(
    classId: string,
    studentId: string,
    predictedType: string,
  ): Promise<ApiResponse> {
    try {
      return await this.provisionAndActivateReactivePerk(classId, studentId, 'prophecy', {
        predictedType,
      });
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to trigger Prophecy prediction: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to trigger Prophecy perk',
        error: errorMessage,
      });
    }
  }

  /**
   * Reveals the upcoming scenario type for Crystal Ball at the start of the
   * invest phase. There is no scenario system yet, so this is called
   * directly (e.g. from a test button); CrystalBall.ts reveals the shared
   * UPCOMING_SCENARIO_TYPE placeholder until the real scenario draw exists.
   */
  async triggerCrystalBallReveal(classId: string, studentId: string): Promise<ApiResponse> {
    try {
      return await this.provisionAndActivateReactivePerk(classId, studentId, 'crystal_ball');
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to trigger Crystal Ball reveal: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to trigger Crystal Ball perk',
        error: errorMessage,
      });
    }
  }

  async triggerInsiderTradingReveal(classId: string, studentId: string): Promise<ApiResponse> {
    try {
      return await this.provisionAndActivateReactivePerk(classId, studentId, 'insider_trading');
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to trigger Insider Trading reveal: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to trigger Insider Trading perk',
        error: errorMessage,
      });
    }
  }

  async triggerExtortionForScenarioStart(classId: string, studentId: string): Promise<ApiResponse> {
    try {
      return await this.provisionAndActivateReactivePerk(classId, studentId, 'extortion');
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to trigger Extortion: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to trigger Extortion perk',
        error: errorMessage,
      });
    }
  }

  async endHardcodedScenario(classId: string): Promise<ApiResponse> {
    return endScenarioEffects(this.prismaService, classId);
  }

  /**
   * Grants Rebirth's 2 shifting points once the scenario has been revealed.
   * There is no scenario system yet, so this is called directly (e.g. from
   * a test button); Rebirth.ts just opens the same shifting window the real
   * shift-points feature already uses.
   */
  async triggerRebirthForScenarioReveal(classId: string, studentId: string): Promise<ApiResponse> {
    try {
      return await this.provisionAndActivateReactivePerk(classId, studentId, 'rebirth');
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to trigger Rebirth for scenario reveal: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to trigger Rebirth perk',
        error: errorMessage,
      });
    }
  }

  async updateXp(classId: string, dtos: StudentXpPair[]): Promise<UpdateStudentXpResponse> {
    try {
      // Level progression: Level 1 = 0 XP, Level 2 = 10 XP, Level 3 = 20 XP, +10 XP per level
      const levelFromXp = (xp: number): number => {
        if (xp < 0) throw new BadRequestException('XP cannot be negative');
        if (xp < 10) return 1;
        if (xp < 20) return 2;
        if (xp < 30) return 3;
        if (xp < 40) return 4;
        return 5; // Level 5 at 40+ XP
      };

      const tasks: Promise<UpdatedStudentXp>[] = dtos.map(async (item) => {
        const enrollment: Enrollment = await this.resuable.checkEnrollment(classId, item.studentId);
        const archetypeTitle = enrollment.enrolledStudent.archtype_id
          ? await this.prismaService.archtypes
              .findUnique({
                where: { id: enrollment.enrolledStudent.archtype_id },
                select: { title: true },
              })
              .then((arch) => arch?.title ?? null)
          : null;
        if (!enrollment.enrolledStudent.archtype_id || !archetypeTitle) {
          throw new BadRequestException({
            success: false,
            message: `Student must have a CEO assigned before XP update`,
          });
        }

        const currentData = await this.prismaService.enrolled_students.findUnique({
          where: { id: enrollment.enrolledStudent.id },
          select: { xp: true, level: true },
        });

        const oldXp = currentData?.xp ?? 0;
        const add = Number(item.xp) || 0;
        const updatedXp = Math.min(40, oldXp + add); // XP capped at 40 (max level)

        if (updatedXp < 0) {
          throw new BadRequestException(`XP cannot be negative for student ${item.studentId}`);
        }

        const newLevel = levelFromXp(updatedXp);

        await this.prismaService.enrolled_students.update({
          where: { id: enrollment.enrolledStudent.id },
          data: { xp: updatedXp, level: newLevel },
        });

        this.classGateway.emitXpUpdated(
          item.studentId,
          { xp: updatedXp, level: newLevel },
          classId,
        );

        const studentPerks = await this.prismaService.student_perks.findMany({
          where: { enrollment_id: enrollment.enrolledStudent.id },
          include: {
            perks: {
              include: {
                perk_types: true,
              },
            },
          },
        });

        // Perk unlocks: first perk (core) at 20 XP, second perk (ultra) at 40 XP
        const perksToUnlock = studentPerks.filter((perk) => {
          const type = perk.perks.perk_types.type.toLowerCase();
          const shouldUnlock =
            (type === 'core' && updatedXp >= 20) || (type === 'ultra' && updatedXp >= 40);
          return shouldUnlock && !perk.is_unlocked;
        });

        if (perksToUnlock.length) {
          await Promise.all(
            perksToUnlock.map((perk) =>
              this.prismaService.student_perks.update({
                where: { id: perk.id },
                data: { is_unlocked: true },
              }),
            ),
          );

          this.classGateway.server.to(classId).emit('perks-auto-unlocked', {
            success: true,
            data: {
              studentId: item.studentId,
              perkIds: perksToUnlock.map((p) => p.id),
              level: newLevel,
              xp: updatedXp,
            },
          });
        }

        return {
          id: item.studentId,
          name: enrollment.user.name,
          xp: updatedXp,
          level: newLevel,
          ceo: {
            id: enrollment.enrolledStudent.archtype_id,
            title: archetypeTitle,
          },
        };
      });

      const settled = await Promise.allSettled(tasks);

      const failed = settled.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        const firstFailed = failed[0];
        let reason = 'Unknown error';
        if (firstFailed.reason instanceof HttpException) {
          const response = firstFailed.reason.getResponse();
          reason =
            typeof response === 'object' && response !== null && 'message' in response
              ? String((response as Record<string, unknown>).message)
              : firstFailed.reason.message;
        } else if (firstFailed.reason instanceof Error) {
          reason = firstFailed.reason.message;
        } else if (typeof firstFailed.reason === 'string') {
          reason = firstFailed.reason;
        }
        throw new BadRequestException({
          success: false,
          message: reason,
        });
      }

      const updated = settled
        .filter((r): r is PromiseFulfilledResult<UpdatedStudentXp> => r.status === 'fulfilled')
        .map((r) => r.value);

      const ranking = updated.slice().sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0));
      const isXpSet = updated.some((e) => (e.xp ?? 0) > 0);

      const result: UpdateStudentXpData = {
        is_xp_set: isXpSet,
        students: ranking.map((s) => ({
          id: s.id,
          name: s.name,
          xp: s.xp,
          level: s.level,
          ceo: s.ceo,
        })),
      };

      return {
        success: true,
        message: 'XP for students updated successfully',
        data: result,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to update XP for students in DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );

      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to update XP for students in DB',
        error: errorMessage,
      });
    }
  }

  async getXp(classId: string): Promise<GetStudentXpResponse> {
    try {
      const exsitingClass = await this.prismaService.renamedclass.findUnique({
        where: { id: classId },
      });
      if (!exsitingClass) {
        throw new BadRequestException({ success: false, message: 'Class not found' });
      }
      const enrollments = await this.prismaService.enrolled_students.findMany({
        where: { class_id: classId },
        include: { archtypes: { select: { title: true } }, users: { select: { name: true } } },
      });

      const data = enrollments.map((enrollment) => {
        return {
          id: enrollment.id,
          name: enrollment.users.name,
          xp: enrollment.xp,
          ceo: {
            id: enrollment.archtype_id,
            title: enrollment.archtypes?.title ?? null,
          },
        };
      });

      const ranking = data.slice().sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0));

      const isXpSet = data.some((e) => (e.xp ?? 0) > 0);
      const result: GetStudentXpData = { is_xp_set: isXpSet, students: ranking };
      return { success: true, message: 'Enrolled Students Xp fetched successfully', data: result };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to update XP for student in DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to update XP for student in DB',
        error: errorMessage,
      });
    }
  }

  async useMomentOfGlory(
    classId: string,
    studentId: string,
    body: MomentOfGloryRequestDto,
  ): Promise<ApiResponse> {
    try {
      const enrollment: Enrollment = await this.resuable.checkEnrollment(classId, studentId);
      await this.prismaService.enrolled_students.update({
        where: { id: enrollment.enrolledStudent.id },
        data: {
          market_share: body.value,
        },
      });
      await this.prismaService.student_perks.update({
        where: { id: body.perkId },
        data: { is_used: true },
      });
      return {
        success: true,
        message: 'Market Share updated successfully',
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to update market share for student in DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to update Market share for student in DB',
        error: errorMessage,
      });
    }
  }

  async useTrendsetter(
    classId: string,
    studentId: string,
    body: TrendsetterRequestDto,
  ): Promise<ApiResponse> {
    try {
      const enrollment: Enrollment = await this.resuable.checkEnrollment(classId, studentId);
      await this.prismaService.enrolled_students.update({
        where: { id: enrollment.enrolledStudent.id },
        data: { market_share: body.student.marketShare },
      });
      await Promise.all(
        body.rival.map((rival) =>
          this.prismaService.enrolled_students.update({
            where: { id: rival.id },
            data: { market_share: rival.marketShare },
          }),
        ),
      );
      return {
        success: true,
        message: 'Market Share Updated successfully',
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to activate Trendsetter perk for student in DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to activate Trendsetter perk for student in DB',
        error: errorMessage,
      });
    }
  }

  async exportClassCsv(classId: string) {
    try {
      const classExists = await this.prismaService.renamedclass.findUnique({
        where: { id: classId },
      });

      if (!classExists) {
        throw new BadRequestException({ success: false, message: `Class not found` });
      }

      const enrollments = await this.prismaService.enrolled_students.findMany({
        where: { class_id: classId },
        include: {
          users: true,
          archtypes: true,
          student_perks: {
            include: { perks: true, perk_usage: true },
          },
          student_attributes: {
            include: { attributes: true },
          },
        },
      });

      if (enrollments.length === 0) {
        throw new NotFoundException(`No students found for class ${classId}`);
      }

      const data = enrollments.map((enroll) => {
        const user = enroll.users;
        const perksUnlocked = enroll.student_perks
          .filter((p) => p.is_unlocked)
          .map((p) => p.perks.title)
          .join(', ');

        const perksUsed = enroll.student_perks
          .filter((p) => p.is_used)
          .map((p) => p.perks.title)
          .join(', ');

        const skillAllocations = enroll.student_attributes
          .map((sa) => `${sa.attributes.name}: ${sa.value}`)
          .join(', ');

        return {
          Name: user.name ?? '',
          Email: user.email ?? '',
          Archetype: enroll.archtypes?.title ?? 'N/A',
          Level: enroll.level ?? 1,
          XP: enroll.xp ?? 0,
          'Perks Unlocked': perksUnlocked,
          'Perks Used': perksUsed,
          'Skill Allocations': skillAllocations,
          'Market Share': enroll.market_share ?? 0,
        };
      });

      type Json2CsvParserInstance = { parse: (input: unknown) => string };
      type Json2CsvParserConstructor = new (opts?: unknown) => Json2CsvParserInstance;
      const Json2CsvParser = Parser as unknown as Json2CsvParserConstructor;
      const parser = new Json2CsvParser();
      return { success: true, message: 'Csv Ready to download', data: parser.parse(data) };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to Fetch data for CSV from DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to Fetch data for CSV from DB',
        error: errorMessage,
      });
    }
  }

  async getMarketShare(classId: string): Promise<GetStudentMarketShareResponse> {
    try {
      const exsitingClass = await this.prismaService.renamedclass.findUnique({
        where: { id: classId },
      });
      if (!exsitingClass) {
        throw new BadRequestException({ success: false, message: 'Class not found' });
      }
      const enrollments = await this.prismaService.enrolled_students.findMany({
        where: { class_id: classId },
        include: { archtypes: { select: { title: true } }, users: { select: { name: true } } },
        orderBy: {
          market_share: 'desc',
        },
      });

      const data = enrollments.map((enrollment) => {
        return {
          id: enrollment.student_id,
          name: enrollment.users.name,
          market_share: enrollment.market_share,
          ceo: {
            id: enrollment.archtype_id,
            title: enrollment.archtypes?.title ?? null,
          },
        };
      });
      const isMsSet = data.some((e) => (e.market_share ?? 0) > 0);
      const result: GetStudentMarketShareData = { is_ms_set: isMsSet, students: data };

      return {
        success: true,
        message: 'Enrolled Students Market Share fetched successfully',
        data: result,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to update Market Share for student in DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to update Market Share for student in DB',
        error: errorMessage,
      });
    }
  }

  async updateMarketShare(
    classId: string,
    dtos: StudentMarketSharePair[],
  ): Promise<UpdateStudentMarketShareResponse> {
    try {
      const students = await this.prismaService.enrolled_students.findMany({
        where: { class_id: classId, student_id: { in: dtos.map((d) => d.studentId) } },
      });
      if (students.length !== dtos.length) {
        throw new BadRequestException({
          success: false,
          message: 'One or more students not found in the class',
        });
      }

      const updatedMarketShare = await Promise.all(
        dtos.map(
          async (item) =>
            await this.prismaService.enrolled_students.update({
              where: { id: students.find((s) => s.student_id === item.studentId)?.id },
              select: {
                id: true,
                student_id: true,
                market_share: true,
                archtype_id: true,
                users: { select: { id: true, name: true } },
                archtypes: { select: { title: true } },
              },
              data: { market_share: item.marketShare },
            }),
        ),
      );

      // Sort by market share to get rankings
      const ranking = updatedMarketShare
        .slice()
        .sort((a, b) => (b.market_share ?? 0) - (a.market_share ?? 0));

      // Check for Double-Down automatic trigger
      // If first place is a Baron with Double-Down available, trigger it
      let doubleDownTriggered = false;
      let doubleDownResult: { stolenFrom?: string; stolenAmount?: number; baronName?: string } = {};

      if (ranking.length >= 2) {
        const firstPlace = ranking[0];
        const secondPlace = ranking[1];

        // Check if first place is a Baron
        const isBaron = firstPlace.archtypes?.title?.toLowerCase().includes('baron');

        if (isBaron) {
          // Check if they have Double-Down available
          const doubleDownCheck = await DoubleDown.checkDoubleDownAvailable(
            this.prismaService,
            firstPlace.id,
          );

          if (doubleDownCheck.available && doubleDownCheck.studentPerkId) {
            const runnerUpMS = secondPlace.market_share ?? 0;

            if (runnerUpMS > 0) {
              this.logger.log(`[Double-Down] Auto-triggering for Baron ${firstPlace.users?.name}`);

              // Transfer runner-up's MS to Baron
              await this.prismaService.$transaction([
                this.prismaService.enrolled_students.update({
                  where: { id: firstPlace.id },
                  data: { market_share: { increment: runnerUpMS } },
                }),
                this.prismaService.enrolled_students.update({
                  where: { id: secondPlace.id },
                  data: { market_share: 0 },
                }),
              ]);

              // Mark perk as used (with cooldown for repeatable)
              await this.markPerkAsUsedById(doubleDownCheck.studentPerkId);

              // Update local ranking data
              firstPlace.market_share = (firstPlace.market_share ?? 0) + runnerUpMS;
              secondPlace.market_share = 0;

              doubleDownTriggered = true;
              doubleDownResult = {
                stolenFrom: secondPlace.users?.name ?? 'Unknown',
                stolenAmount: runnerUpMS,
                baronName: firstPlace.users?.name ?? 'Baron',
              };

              // Emit Double-Down event to notify players
              this.classGateway.server.to(classId).emit('double-down-triggered', {
                success: true,
                message: `Double-Down! ${firstPlace.users?.name} stole ${runnerUpMS} market share from ${secondPlace.users?.name}!`,
                data: {
                  baron: {
                    id: firstPlace.student_id,
                    name: firstPlace.users?.name,
                    newMarketShare: firstPlace.market_share,
                  },
                  victim: {
                    id: secondPlace.student_id,
                    name: secondPlace.users?.name,
                    newMarketShare: 0,
                  },
                  stolenAmount: runnerUpMS,
                },
              });

              this.logger.log(
                `[Double-Down] Baron ${firstPlace.users?.name} stole ${runnerUpMS} MS from ${secondPlace.users?.name}`,
              );
            }
          }
        }
      }

      // Re-sort after Double-Down (if triggered)
      const finalRanking = updatedMarketShare
        .slice()
        .sort((a, b) => (b.market_share ?? 0) - (a.market_share ?? 0));

      const isMsSet = finalRanking.some((e) => (e.market_share ?? 0) > 0);
      const resultData: UpdateStudentMarketShareData = {
        is_ms_set: isMsSet,
        students: finalRanking.map((s) => ({
          id: s.student_id,
          name: s.users.name,
          marketShare: s.market_share,
          ceo: {
            id: s.archtype_id,
            title: s.archtypes?.title ?? null,
          },
        })),
      };

      // Emit leaderboard update to all clients in the class room
      this.classGateway.emitLeaderboardUpdated(classId, resultData.students);

      let message = 'Market Share for students updated successfully';
      if (doubleDownTriggered) {
        message += `. Double-Down activated! ${doubleDownResult.baronName} stole ${doubleDownResult.stolenAmount} MS from ${doubleDownResult.stolenFrom}!`;
      }
      return {
        success: true,
        message,
        data: resultData,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to update market share in DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );

      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to update market share in DB',
        error: errorMessage,
      });
    }
  }

  async updatePerkStatus(perkId: string, status: perk_status): Promise<ApiResponse> {
    try {
      const updatedPerk = await this.prismaService.student_perks.update({
        where: { id: perkId },
        data: {
          perk_status: status,
        },
      });

      if (!updatedPerk) {
        throw new NotFoundException({ success: false, message: 'Perk not found for the student' });
      }

      return { success: true, message: 'Perk status updated successfully' };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to update perk status in DB: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to update perk status in DB',
        error: errorMessage,
      });
    }
  }

  /** Student activates an unlocked perk → sets perk_status = pending, notifies teacher via socket */
  async activateStudentPerk(
    classId: string,
    studentId: string,
    studentPerkId: string,
  ): Promise<ApiResponse> {
    try {
      const enrollment = await this.prismaService.enrolled_students.findFirst({
        where: { student_id: studentId, class_id: classId },
        include: { users: { select: { name: true } } },
      });
      if (!enrollment) {
        throw new NotFoundException({ success: false, message: 'Enrollment not found' });
      }

      const studentPerk = await this.prismaService.student_perks.findFirst({
        where: { id: studentPerkId, enrollment_id: enrollment.id },
        include: { perks: true },
      });
      if (!studentPerk) {
        throw new NotFoundException({ success: false, message: 'Perk not found for student' });
      }
      if (!studentPerk.is_unlocked) {
        throw new BadRequestException({ success: false, message: 'Perk is not unlocked yet' });
      }
      if (
        studentPerk.is_used &&
        (!studentPerk.perks.is_repeatable ||
          !studentPerk.next_available_at ||
          studentPerk.next_available_at > new Date())
      ) {
        throw new BadRequestException({ success: false, message: 'Perk is used or cooling down' });
      }
      if (studentPerk.is_approved || studentPerk.perk_status === 'pending') {
        throw new BadRequestException('This perk already has an approval or pending request.');
      }
      if (isNewPerkKey(studentPerk.perks.key)) {
        const template = await this.prismaService.perks.findUniqueOrThrow({
          where: { id: studentPerk.perk_id },
          include: { perk_types: true },
        });
        if (
          enrollment.archtype_id !== template.archtype_id ||
          (enrollment.level ?? 1) < requiredPerkLevel(template.perk_types.type)
        ) {
          throw new BadRequestException(
            'The student has not unlocked this CEO perk at the required level.',
          );
        }
      }

      await this.prismaService.student_perks.update({
        where: { id: studentPerkId },
        data: { perk_status: 'pending', is_approved: false },
      });

      // Notify teacher via socket
      const classData = await this.prismaService.renamedclass.findUnique({
        where: { id: classId },
        select: { instructor_id: true },
      });
      if (classData) {
        this.classGateway.emitPerkApprovalRequest({
          student: { id: studentId, name: enrollment.users?.name ?? '' },
          classId,
          teacherId: classData.instructor_id,
          perk: { id: studentPerkId, title: studentPerk.perks.title },
        });
      }

      return { success: true, message: `Perk "${studentPerk.perks.title}" activation requested` };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to activate perk: ${errorMessage}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to activate perk',
        error: errorMessage,
      });
    }
  }

  /** Teacher resets a used perk back to its initial unlocked state (perk_status = null, is_used = false) */
  async resetStudentPerk(
    classId: string,
    studentId: string,
    studentPerkId: string,
  ): Promise<ApiResponse> {
    try {
      const enrollment = await this.prismaService.enrolled_students.findFirst({
        where: { student_id: studentId, class_id: classId },
        select: { id: true },
      });
      if (!enrollment) {
        throw new NotFoundException({ success: false, message: 'Enrollment not found' });
      }

      const studentPerk = await this.prismaService.student_perks.findFirst({
        where: { id: studentPerkId, enrollment_id: enrollment.id },
        include: { perks: true },
      });
      if (!studentPerk) {
        throw new NotFoundException({ success: false, message: 'Perk not found for student' });
      }

      await this.prismaService.student_perks.update({
        where: { id: studentPerkId },
        data: {
          is_used: false,
          is_approved: false,
          perk_status: null,
          last_used_at: null,
          next_available_at: null,
        },
      });

      // Notify the student their perk has been reset
      this.classGateway.emitPerkStatusChanged(studentId, {
        perkId: studentPerkId,
        title: studentPerk.perks.title,
        perk_status: 'reset',
        perkKey: studentPerk.perks.key,
      });

      return { success: true, message: `Perk "${studentPerk.perks.title}" reset` };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to reset perk: ${errorMessage}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to reset perk',
        error: errorMessage,
      });
    }
  }

  /** Teacher unlocks a specific student perk (sets is_unlocked = true) */
  async unlockStudentPerk(
    classId: string,
    studentId: string,
    studentPerkId: string,
  ): Promise<ApiResponse> {
    try {
      const enrollment = await this.prismaService.enrolled_students.findFirst({
        where: { student_id: studentId, class_id: classId },
        select: { id: true },
      });
      if (!enrollment) {
        throw new NotFoundException({ success: false, message: 'Enrollment not found' });
      }

      const studentPerk = await this.prismaService.student_perks.findFirst({
        where: { id: studentPerkId, enrollment_id: enrollment.id },
        include: { perks: true },
      });
      if (!studentPerk) {
        throw new NotFoundException({ success: false, message: 'Perk not found for student' });
      }

      await this.prismaService.student_perks.update({
        where: { id: studentPerkId },
        data: { is_unlocked: true, perk_status: null },
      });

      // Emit socket event to the specific student
      this.classGateway.emitPerkUnlocked(studentId, {
        perkId: studentPerkId,
        title: studentPerk.perks.title,
      });

      return { success: true, message: `Perk "${studentPerk.perks.title}" unlocked` };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to unlock perk: ${errorMessage}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to unlock perk',
        error: errorMessage,
      });
    }
  }

  /**
   * Mark a perk as used by its student_perk ID
   * Used for two-phase perks like Trailblazer that need to be marked after selection
   */
  async markPerkAsUsedById(studentPerkId: string): Promise<void> {
    try {
      const studentPerk = await this.prismaService.student_perks.findUnique({
        where: { id: studentPerkId },
        include: { perks: true },
      });

      if (!studentPerk) {
        throw new NotFoundException({ success: false, message: 'Student perk not found' });
      }

      if (studentPerk.perks.is_repeatable) {
        await this.prismaService.student_perks.update({
          where: { id: studentPerkId },
          data: {
            is_used: true,
            last_used_at: new Date(),
            next_available_at: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes cooldown
            is_approved: false,
            perk_status: null,
          },
        });
      } else {
        await this.prismaService.student_perks.update({
          where: { id: studentPerkId },
          data: {
            is_used: true,
            is_approved: false,
            perk_status: null,
          },
        });
      }
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to mark perk as used: ${errorMessage}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to mark perk as used',
        error: errorMessage,
      });
    }
  }

  async managePerk(
    teacherId: string,
    classId: string,
    studentId: string,
    perkId: string,
    action: 'lock' | 'unlock' | 'reset',
  ): Promise<ApiResponse> {
    try {
      // Verify enrollment and teacher authority
      const enrollment = await this.resuable.checkEnrollment(classId, studentId);

      if (enrollment.class.instructor_id !== teacherId) {
        throw new BadRequestException({
          success: false,
          message: 'You are not authorized to manage perks for this class',
        });
      }

      const studentPerk = await this.prismaService.student_perks.findUnique({
        where: { id: perkId },
        include: { perks: true },
      });

      if (!studentPerk) {
        throw new NotFoundException({ success: false, message: 'Perk not found for student' });
      }

      if (studentPerk.enrollment_id !== enrollment.enrolledStudent.id) {
        throw new BadRequestException({
          success: false,
          message: 'Perk does not belong to the specified student',
        });
      }

      type UpdateData =
        | { is_unlocked: boolean; perk_status?: null }
        | { is_used: boolean; is_approved: boolean; perk_status: null };

      let updateData: UpdateData;
      let successMessage = '';

      switch (action) {
        case 'lock':
          updateData = { is_unlocked: false };
          successMessage = `Perk "${studentPerk.perks.title}" locked`;
          break;
        case 'unlock':
          updateData = { is_unlocked: true, perk_status: null };
          successMessage = `Perk "${studentPerk.perks.title}" unlocked`;
          break;
        case 'reset':
          updateData = {
            is_used: false,
            is_approved: false,
            perk_status: null,
          };
          successMessage = `Perk "${studentPerk.perks.title}" reset`;
          break;
        default:
          throw new BadRequestException('Invalid action');
      }

      await this.prismaService.student_perks.update({
        where: { id: perkId },
        data: updateData,
      });

      return {
        success: true,
        message: successMessage,
        data: { perkId, action, ...updateData } as Record<string, unknown>,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to manage perk: ${errorMessage}`,
        error instanceof Error ? (error.stack ?? '') : '',
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to manage perk',
        error: errorMessage,
      });
    }
  }

  async getClassStatus(classId: string): Promise<{ name: string; is_active: boolean } | null> {
    const classData = await this.prismaService.renamedclass.findUnique({
      where: { id: classId },
      select: { name: true, is_active: true },
    });
    return classData;
  }

  async getClassOverview(classId: string): Promise<GetClassOverviewResponse> {
    try {
      // Single query: fetch enrollments directly (if the class doesn't exist there simply won't be any)
      const enrollments = await this.prismaService.enrolled_students.findMany({
        where: { class_id: classId },
        orderBy: { created_at: 'asc' },
        select: {
          student_id: true,
          xp: true,
          level: true,
          market_share: true,
          archtype_id: true,
          users: { select: { name: true } },
          archtypes: { select: { title: true } },
          student_perks: {
            select: {
              id: true,
              is_approved: true,
              is_unlocked: true,
              is_used: true,
              perk_status: true,
              last_used_at: true,
              next_available_at: true,
              perks: {
                select: {
                  title: true,
                  description: true,
                  key: true,
                  is_coded: true,
                  is_repeatable: true,
                  auto_approve: true,
                },
              },
            },
          },
          student_attributes: {
            select: {
              value: true,
              attributes: { select: { name: true } },
            },
          },
        },
      });

      const data: ClassOverviewStudent[] = enrollments.map((enrollment) => {
        const skillsMap: Record<string, number> = {};
        for (const attr of enrollment.student_attributes) {
          skillsMap[attr.attributes?.name.toLowerCase()] = attr.value ?? 0;
        }

        return {
          id: enrollment.student_id,
          name: enrollment.users.name,
          ceo: {
            id: enrollment.archtype_id,
            title: enrollment.archtypes?.title ?? null,
          },
          level: enrollment.level ?? 1,
          xp: enrollment.xp ?? 0,
          market_share: enrollment.market_share ?? 0,
          skills: {
            team: skillsMap['team'] ?? 0,
            logistics: skillsMap['logistics'] ?? 0,
            marketing: skillsMap['marketing'] ?? 0,
            innovation: skillsMap['innovation'] ?? 0,
            quality: skillsMap['quality'] ?? 0,
          },
          // Include reactive perks in the teacher approval table.
          perks: enrollment.student_perks.map((perk) => ({
            id: perk.id,
            key: perk.perks.key,
            title: perk.perks.title,
            description: perk.perks.description,
            is_coded: perk.perks.is_coded,
            is_repeatable: perk.perks.is_repeatable,
            auto_approve: isNewPerkKey(perk.perks.key) ? false : perk.perks.auto_approve,
            perk_status: perk.perk_status,
            is_unlocked: perk.is_unlocked,
            last_used_at: perk.last_used_at,
            next_available_at: perk.next_available_at,
            is_used: perk.is_used,
            is_approved: perk.is_approved,
          })),
        };
      });

      return {
        success: true,
        message: 'Class overview fetched successfully',
        data,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to fetch class overview: ${errorMessage}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to fetch class overview',
        error: errorMessage,
      });
    }
  }

  async continueClass(
    sourceClassId: string,
    dto: CreateClassRequestDto,
    userId: string,
  ): Promise<CreateClassResponseDto> {
    try {
      // 1. Load source class + all enrolled students with their full state
      const sourceEnrollments = await this.prismaService.enrolled_students.findMany({
        where: { class_id: sourceClassId },
        select: {
          student_id: true,
          xp: true,
          level: true,
          market_share: true,
          archtype_id: true,
          available_points: true,
          skill_unlocked: true,
          student_attributes: {
            select: { attribute_id: true, value: true },
          },
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
      });

      if (sourceEnrollments.length === 0) {
        throw new BadRequestException({
          success: false,
          message: 'No students found in source class',
        });
      }

      // 2. Create the new class record
      const newClass = await this.prismaService.renamedclass.create({
        data: {
          meeting_id: dto.meetingId,
          name: dto.name,
          meeting_link: dto.meetingLink,
          passcode: dto.passcode,
          duration: dto.duration,
          allocated_points: dto.allocatePoints,
          instructor_id: userId,
          start_time: dto.startTime ? new Date(dto.startTime) : null,
          end_time: dto.endTime ? new Date(dto.endTime) : null,
        },
      });

      // 3. Create enrollments copying XP, level, MS, CEO
      await this.prismaService.enrolled_students.createMany({
        data: sourceEnrollments.map((e) => ({
          student_id: e.student_id,
          class_id: newClass.id,
          xp: e.xp ?? 0,
          level: e.level ?? 1,
          market_share: e.market_share ?? 0,
          archtype_id: e.archtype_id,
          available_points: e.available_points ?? dto.allocatePoints ?? 10,
          skill_unlocked: e.skill_unlocked ?? true,
        })),
        skipDuplicates: true,
      });

      // 4. Fetch the newly created enrollment IDs mapped by student_id
      const newEnrollments = await this.prismaService.enrolled_students.findMany({
        where: { class_id: newClass.id },
        select: { id: true, student_id: true },
      });
      const enrollmentMap = new Map(newEnrollments.map((e) => [e.student_id, e.id]));

      // 5. Copy skill attribute values
      const attributeData = sourceEnrollments.flatMap((src) => {
        const newEnrollmentId = enrollmentMap.get(src.student_id);
        if (!newEnrollmentId) return [];
        return src.student_attributes.map((attr) => ({
          enrollment_id: newEnrollmentId,
          attribute_id: attr.attribute_id,
          value: attr.value,
        }));
      });
      if (attributeData.length > 0) {
        await this.prismaService.student_attributes.createMany({ data: attributeData });
      }

      // 6. Copy perk unlock states (preserve used/approved/perk_status from source)
      const perkData = sourceEnrollments.flatMap((src) => {
        const newEnrollmentId = enrollmentMap.get(src.student_id);
        if (!newEnrollmentId) return [];
        return src.student_perks.map((sp) => ({
          enrollment_id: newEnrollmentId,
          perk_id: sp.perk_id,
          is_unlocked: sp.is_unlocked,
          is_used: sp.is_used,
          is_approved: sp.is_approved,
          perk_status: sp.perk_status,
        }));
      });
      if (perkData.length > 0) {
        await this.prismaService.student_perks.createMany({ data: perkData });
      }

      return {
        success: true,
        message: 'Class continued successfully',
        data: {
          id: newClass.id,
          created_at: newClass.created_at,
          meeting_id: dto.meetingId,
          name: newClass.name,
          meeting_link: newClass.meeting_link ?? '',
          passcode: newClass.passcode ?? undefined,
          duration: newClass.duration ?? undefined,
          allocate_points:
            newClass.allocated_points != null ? Number(newClass.allocated_points) : null,
          instructor_id: userId,
          enrolled_student: sourceEnrollments.map((e) => e.student_id),
          start_time: newClass.start_time ?? null,
          end_time: newClass.end_time ?? null,
        },
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to continue class: ${errorMessage}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to continue class',
        error: errorMessage,
      });
    }
  }
}
