import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DateTime } from 'luxon';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@utils/prisma/prisma.service';
import {
  CohortListItemDto,
  CohortProgressionDto,
  CohortScheduleSummaryDto,
  CohortStudentDto,
  CreateCohortDto,
  CreateScheduleDto,
  GenerateClassesDto,
  ScheduleItemDto,
  UpdateCohortDto,
  UpdateScheduleDto,
} from './dto/cohort.dto';
import { resolveCohortTimezone, toUtcInstant } from './schedule-occurrence.util';
import { ZoomMeetingService } from './zoom-meeting.service';
import { lockCohort, occupiedSeats } from './cohort-capacity';

const COHORT_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  status: true,
  program_name: true,
  level: true,
  start_date: true,
  end_date: true,
  timezone: true,
  max_students: true,
  total_students: true,
  total_classes: true,
  cover_image: true,
  tags: true,
  teacher_id: true,
  archived_at: true,
  cohort_schedules: {
    select: {
      day_of_week: true,
      start_time: true,
      end_time: true,
    },
  },
} as const;

@Injectable()
export class CohortService {
  private readonly logger = new Logger(CohortService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly zoomMeeting: ZoomMeetingService,
  ) {}

  private mapCohort = async (c: {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    status: string;
    program_name: string | null;
    level: string | null;
    start_date: Date | null;
    end_date: Date | null;
    timezone: string | null;
    max_students: number;
    total_students: number;
    total_classes: number;
    cover_image: string | null;
    tags: unknown;
    teacher_id: string | null;
    archived_at: Date | null;
    cohort_schedules: CohortScheduleSummaryDto[];
  }): Promise<CohortListItemDto> => {
    const [actualClassCount, enrolled, reserved] = await Promise.all([
      this.prisma.renamedclass.count({ where: { cohort_id: c.id } }),
      this.prisma.cohort_students.count({ where: { cohort_id: c.id } }),
      this.prisma.checkout_orders.count({ where: { cohort_id: c.id, seat_reserved: true } }),
    ]);
    const { cohort_schedules, ...rest } = c;
    return {
      ...rest,
      total_classes: actualClassCount,
      total_students: enrolled,
      available_spots: Math.max(0, c.max_students - enrolled - reserved),
      schedules: cohort_schedules,
    };
  };

  async findAll(): Promise<CohortListItemDto[]> {
    const cohorts = await this.prisma.cohorts.findMany({
      where: { is_public: true, status: 'active', archived_at: null },
      orderBy: { start_date: 'asc' },
      select: COHORT_SELECT,
    });
    return Promise.all(cohorts.map((c) => this.mapCohort(c)));
  }

  async findAllByTeacher(teacherId: string): Promise<CohortListItemDto[]> {
    const cohorts = await this.prisma.cohorts.findMany({
      where: { teacher_id: teacherId },
      orderBy: { created_at: 'desc' },
      select: COHORT_SELECT,
    });
    return Promise.all(cohorts.map((c) => this.mapCohort(c)));
  }

  async findStudentCohorts(studentId: string): Promise<CohortListItemDto[]> {
    const rows = await this.prisma.cohort_students.findMany({
      where: { student_id: studentId },
      include: { cohorts: { select: COHORT_SELECT } },
    });
    return Promise.all(rows.map((r) => this.mapCohort(r.cohorts)));
  }

  async findOne(id: string): Promise<CohortListItemDto> {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id },
      select: COHORT_SELECT,
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    return this.mapCohort(cohort);
  }

  /**
   * Creates a cohort AND its dedicated Zoom meeting as a single logical
   * operation. Postgres can't span an external HTTP call inside a
   * transaction, so this is implemented as create-Zoom-first, then
   * persist-or-compensate:
   *   - Zoom fails            -> throw, nothing is written to the DB.
   *   - Zoom succeeds, DB fails -> delete the orphaned Zoom meeting, then throw.
   *   - Both succeed          -> exactly one cohort, owning exactly one meeting.
   * `idempotencyKey` (from the client's `Idempotency-Key` header) makes a
   * retried request return the original result instead of creating a
   * second meeting.
   */
  async create(
    dto: CreateCohortDto,
    teacherId: string,
    idempotencyKey?: string,
  ): Promise<CohortListItemDto> {
    if (dto.start_date && dto.end_date && new Date(dto.start_date) >= new Date(dto.end_date)) {
      throw new BadRequestException({
        success: false,
        message: 'start_date must be before end_date',
      });
    }

    if (idempotencyKey) {
      const existing = await this.prisma.cohorts.findUnique({
        where: { idempotency_key: idempotencyKey },
        select: { ...COHORT_SELECT, zoom_meeting_id: true, zoom_uuid: true, zoom_join_url: true },
      });
      if (existing) {
        this.logger.log(
          `create: idempotency key already fulfilled — returning existing cohort ${existing.id}`,
        );
        return this.mapCohort(existing);
      }
    }

    // Every cohort gets exactly one, unique Zoom meeting, created up front.
    // If Zoom is unreachable or rejects the request, ZoomMeetingService
    // throws and NOTHING below runs — there is no fallback to a shared or
    // default meeting, and no cohort is persisted.
    const meeting = await this.zoomMeeting.createMeeting(dto.name);

    try {
      const cohort = await this.prisma.cohorts.create({
        data: {
          name: dto.name,
          slug: dto.slug ?? null,
          description: dto.description ?? null,
          program_name: dto.program_name ?? null,
          level: dto.level ?? null,
          start_date: dto.start_date ? new Date(dto.start_date) : null,
          end_date: dto.end_date ? new Date(dto.end_date) : null,
          timezone: dto.timezone ?? null,
          cover_image: dto.cover_image ?? null,
          tags: dto.tags ?? [],
          is_public: dto.is_public ?? false,
          max_students: dto.max_students ?? 0,
          teacher_id: teacherId,
          zoom_meeting_id: meeting.meetingId,
          zoom_uuid: meeting.uuid,
          zoom_join_url: meeting.joinUrl,
          zoom_start_url: meeting.startUrl,
          zoom_passcode: meeting.passcode,
          zoom_host_id: meeting.hostId,
          idempotency_key: idempotencyKey ?? null,
        },
        select: { ...COHORT_SELECT, zoom_meeting_id: true, zoom_uuid: true, zoom_join_url: true },
      });
      return this.mapCohort(cohort);
    } catch (error: unknown) {
      // The Zoom meeting exists but the cohort row didn't persist — roll
      // back the meeting rather than leave it orphaned in the host account.
      await this.zoomMeeting.deleteMeeting(meeting.meetingId);

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : '';
        if (target.includes('idempotency_key') && idempotencyKey) {
          // Lost a race with a concurrent identical request. That request's
          // cohort is the one that should exist — return it rather than
          // surface an error for what the caller sees as a retried success.
          const winner = await this.prisma.cohorts.findUnique({
            where: { idempotency_key: idempotencyKey },
            select: {
              ...COHORT_SELECT,
              zoom_meeting_id: true,
              zoom_uuid: true,
              zoom_join_url: true,
            },
          });
          if (winner) return this.mapCohort(winner);
        }
        throw new ConflictException({
          success: false,
          message: 'A cohort with conflicting unique fields already exists',
        });
      }

      this.logger.error('create: failed to persist cohort after Zoom meeting was created', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateCohortDto, teacherId: string): Promise<CohortListItemDto> {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id },
      select: { teacher_id: true, start_date: true, end_date: true },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });

    const newStart = dto.start_date ? new Date(dto.start_date) : cohort.start_date;
    const newEnd = dto.end_date ? new Date(dto.end_date) : cohort.end_date;
    if (newStart && newEnd && newStart >= newEnd) {
      throw new BadRequestException({
        success: false,
        message: 'start_date must be before end_date',
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await lockCohort(tx, id);
      if (dto.max_students !== undefined && dto.max_students < (await occupiedSeats(tx, id))) {
        throw new BadRequestException(
          'Capacity cannot be lower than enrolled students and reserved seats',
        );
      }
      return tx.cohorts.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.slug !== undefined && { slug: dto.slug }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.program_name !== undefined && { program_name: dto.program_name }),
          ...(dto.level !== undefined && { level: dto.level }),
          ...(dto.start_date !== undefined && { start_date: new Date(dto.start_date) }),
          ...(dto.end_date !== undefined && { end_date: new Date(dto.end_date) }),
          ...(dto.timezone !== undefined && { timezone: dto.timezone }),
          ...(dto.cover_image !== undefined && { cover_image: dto.cover_image }),
          ...(dto.tags !== undefined && { tags: dto.tags }),
          ...(dto.is_public !== undefined && { is_public: dto.is_public }),
          ...(dto.max_students !== undefined && { max_students: dto.max_students }),
          ...(dto.status !== undefined && { status: dto.status }),
          updated_at: new Date(),
        },
        select: COHORT_SELECT,
      });
    });
    return this.mapCohort(updated);
  }

  async archive(id: string, teacherId: string): Promise<void> {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id },
      select: { teacher_id: true },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });

    await this.prisma.cohorts.update({
      where: { id },
      data: { status: 'archived', archived_at: new Date(), updated_at: new Date() },
    });
  }

  async addStudent(
    cohortId: string,
    studentId: string,
    teacherId: string,
  ): Promise<CohortStudentDto> {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: { teacher_id: true, max_students: true, total_students: true },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });

    const student = await this.prisma.users.findUnique({
      where: { id: studentId },
      include: { roles: true },
    });
    if (!student) throw new NotFoundException({ success: false, message: 'Student not found' });
    if (student.roles.name !== 'student')
      throw new BadRequestException({ success: false, message: 'User is not a student' });

    const row = await this.prisma.$transaction(async (tx) => {
      const current = await lockCohort(tx, cohortId);
      if (current.teacher_id !== teacherId) throw new ForbiddenException('Forbidden');
      if (
        await tx.cohort_students.findUnique({
          where: { cohort_id_student_id: { cohort_id: cohortId, student_id: studentId } },
        })
      )
        throw new ConflictException('This account is already registered for this cohort');
      if (current.max_students > 0 && (await occupiedSeats(tx, cohortId)) >= current.max_students) {
        throw new BadRequestException('Cohort is at maximum capacity');
      }
      const created = await tx.cohort_students.create({
        data: { cohort_id: cohortId, student_id: studentId },
        include: { users: { select: { id: true, name: true, email: true } } },
      });
      await tx.cohorts.update({
        where: { id: cohortId },
        data: {
          total_students: await tx.cohort_students.count({ where: { cohort_id: cohortId } }),
          updated_at: new Date(),
        },
      });
      return created;
    });

    return {
      id: row.users.id,
      name: row.users.name,
      email: row.users.email,
      joined_at: row.joined_at,
    };
  }

  async removeStudent(cohortId: string, studentId: string, teacherId: string): Promise<void> {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: { teacher_id: true },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });

    const row = await this.prisma.cohort_students.findUnique({
      where: { cohort_id_student_id: { cohort_id: cohortId, student_id: studentId } },
    });
    if (!row) throw new NotFoundException({ success: false, message: 'Student not in cohort' });

    await this.prisma.$transaction(async (tx) => {
      await lockCohort(tx, cohortId);
      await tx.cohort_students.delete({
        where: { cohort_id_student_id: { cohort_id: cohortId, student_id: studentId } },
      });
      await tx.cohorts.update({
        where: { id: cohortId },
        data: {
          total_students: await tx.cohort_students.count({ where: { cohort_id: cohortId } }),
          updated_at: new Date(),
        },
      });
    });
  }

  async getStudents(cohortId: string): Promise<CohortStudentDto[]> {
    await this.findOne(cohortId);
    const rows = await this.prisma.cohort_students.findMany({
      where: { cohort_id: cohortId },
      include: { users: { select: { id: true, name: true, email: true } } },
      orderBy: { joined_at: 'asc' },
    });
    return rows.map((r) => ({
      id: r.users.id,
      name: r.users.name,
      email: r.users.email,
      joined_at: r.joined_at,
    }));
  }

  async getClasses(cohortId: string) {
    await this.findOne(cohortId);
    const classes = await this.prisma.renamedclass.findMany({
      where: { cohort_id: cohortId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        meeting_id: true,
        meeting_link: true,
        passcode: true,
        start_time: true,
        end_time: true,
        is_active: true,
        _count: {
          select: {
            enrolled_students: { where: { is_cancelled: false } },
          },
        },
      },
    });

    return classes.map((c) => ({
      id: c.id,
      name: c.name,
      meeting_id: c.meeting_id,
      meeting_link: c.meeting_link,
      passcode: c.passcode,
      start_time: c.start_time,
      end_time: c.end_time,
      is_active: c.is_active,
      total_students: c._count.enrolled_students,
    }));
  }

  async getClassEnrolledStudents(cohortId: string, classId: string): Promise<CohortStudentDto[]> {
    await this.findOne(cohortId);
    const cls = await this.prisma.renamedclass.findUnique({
      where: { id: classId },
      select: { cohort_id: true },
    });
    if (!cls) throw new NotFoundException({ success: false, message: 'Class not found' });
    if (cls.cohort_id !== cohortId)
      throw new BadRequestException({
        success: false,
        message: 'Class does not belong to this cohort',
      });

    const enrollments = await this.prisma.enrolled_students.findMany({
      where: { class_id: classId, is_cancelled: false },
      select: {
        created_at: true,
        users: { select: { id: true, name: true, email: true } },
      },
    });
    return enrollments.map((e) => ({
      id: e.users.id,
      name: e.users.name,
      email: e.users.email,
      joined_at: e.created_at,
    }));
  }

  async getCohortPlayers(cohortId: string, classId: string, studentId: string) {
    const cohort = await this.findOne(cohortId);
    const classRecord = await this.prisma.renamedclass.findUnique({
      where: { id: classId },
      select: { cohort_id: true },
    });
    if (!classRecord) throw new NotFoundException({ success: false, message: 'Class not found' });
    if (classRecord.cohort_id !== cohortId)
      throw new BadRequestException({
        success: false,
        message: 'Class does not belong to this cohort',
      });

    const [viewerMembership, students] = await Promise.all([
      this.prisma.cohort_students.findUnique({
        where: { cohort_id_student_id: { cohort_id: cohortId, student_id: studentId } },
        select: { id: true },
      }),
      this.prisma.cohort_students.findMany({
        where: { cohort_id: cohortId },
        orderBy: { joined_at: 'asc' },
        select: { student_id: true, users: { select: { id: true, name: true } } },
      }),
    ]);

    if (!viewerMembership)
      throw new ForbiddenException({
        success: false,
        message: 'Student is not a member of this cohort',
      });

    const enrollments = await this.prisma.enrolled_students.findMany({
      where: {
        class_id: classId,
        student_id: { in: students.map((student) => student.student_id) },
        is_cancelled: false,
      },
      select: {
        student_id: true,
        archtypes: { select: { title: true } },
      },
    });
    const ceoByStudentId = new Map(
      enrollments.map((enrollment) => [enrollment.student_id, enrollment.archtypes?.title ?? null]),
    );

    return {
      max_students: cohort.max_students,
      students: students.map((student) => ({
        id: student.users.id,
        name: student.users.name,
        ceo_title: ceoByStudentId.get(student.student_id) ?? null,
      })),
    };
  }

  async enrollStudents(cohortId: string, classId: string, studentIds: string[], teacherId: string) {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: { teacher_id: true },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });

    const cls = await this.prisma.renamedclass.findUnique({
      where: { id: classId },
      select: { cohort_id: true },
    });
    if (!cls) throw new NotFoundException({ success: false, message: 'Class not found' });
    if (cls.cohort_id !== cohortId)
      throw new BadRequestException({
        success: false,
        message: 'Class does not belong to this cohort',
      });

    const cohortStudents = await this.prisma.cohort_students.findMany({
      where: { cohort_id: cohortId, student_id: { in: studentIds } },
      select: { student_id: true },
    });
    const validStudentIds = new Set(cohortStudents.map((s) => s.student_id));
    const invalidIds = studentIds.filter((id) => !validStudentIds.has(id));
    if (invalidIds.length > 0) {
      throw new BadRequestException({
        success: false,
        message: `Students not in cohort: ${invalidIds.join(', ')}`,
      });
    }

    const results = await Promise.allSettled(
      studentIds.map((sid) =>
        this.prisma.enrolled_students.upsert({
          where: { student_id_class_id: { student_id: sid, class_id: classId } },
          create: { student_id: sid, class_id: classId },
          update: { is_cancelled: false },
          select: { id: true, student_id: true, class_id: true },
        }),
      ),
    );

    const enrolled = results
      .filter((r) => r.status === 'fulfilled')
      .map(
        (r) =>
          (r as PromiseFulfilledResult<{ id: string; student_id: string; class_id: string }>).value,
      );

    // Unlike createClass, upsert above only touches enrolled_students — an
    // enrollment with no student_attributes rows has nothing for the
    // TEAM/QUALITY/MARKETING/LOGISTICS/INNOVATION cells to bind to, so they
    // render permanently disabled regardless of skill_unlocked. Backfill only
    // the enrollments that are actually missing attributes (re-enrolling an
    // already-enrolled student must not duplicate their existing skills).
    const enrollmentIds = enrolled.map((e) => e.id);
    if (enrollmentIds.length > 0) {
      const existingAttrCounts = await this.prisma.student_attributes.groupBy({
        by: ['enrollment_id'],
        where: { enrollment_id: { in: enrollmentIds } },
      });
      const alreadyHasAttrs = new Set(existingAttrCounts.map((c) => c.enrollment_id));
      const needsAttrs = enrollmentIds.filter((id) => !alreadyHasAttrs.has(id));

      if (needsAttrs.length > 0) {
        const allAttributes = await this.prisma.attributes.findMany({
          select: { id: true, value: true },
        });
        if (allAttributes.length > 0) {
          await this.prisma.student_attributes.createMany({
            data: needsAttrs.flatMap((enrollmentId) =>
              allAttributes.map((attr) => ({
                enrollment_id: enrollmentId,
                attribute_id: attr.id,
                value: attr.value ?? 0,
              })),
            ),
          });
        }
      }
    }

    return { enrolled_count: enrolled.length, enrollments: enrolled };
  }

  async getProgression(cohortId: string): Promise<CohortProgressionDto[]> {
    await this.findOne(cohortId);
    const rows = await this.prisma.cohort_progression.findMany({
      where: { cohort_id: cohortId },
      orderBy: { week_number: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      cohort_id: r.cohort_id,
      week_number: r.week_number,
      total_xp: r.total_xp,
      average_level: Number(r.average_level),
      total_market_share: r.total_market_share,
      completion_rate: Number(r.completion_rate),
      active_students: r.active_students,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  async computeAndSaveProgression(
    cohortId: string,
    weekNumber: number,
  ): Promise<CohortProgressionDto> {
    await this.findOne(cohortId);

    const classes = await this.prisma.renamedclass.findMany({
      where: { cohort_id: cohortId },
      select: { id: true },
    });
    const classIds = classes.map((c) => c.id);

    const enrollments = await this.prisma.enrolled_students.findMany({
      where: { class_id: { in: classIds }, is_cancelled: false },
      select: { student_id: true, xp: true, level: true, market_share: true },
    });

    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: { total_students: true },
    });
    const totalStudents = cohort?.total_students ?? 0;

    const total_xp = enrollments.reduce((s, e) => s + (e.xp ?? 0), 0);
    const avg_level =
      enrollments.length > 0
        ? enrollments.reduce((s, e) => s + (e.level ?? 1), 0) / enrollments.length
        : 0;
    const total_market_share = enrollments.reduce((s, e) => s + (e.market_share ?? 0), 0);
    const activeSet = new Set(enrollments.map((e) => e.student_id));
    const active_students = activeSet.size;
    const completion_rate = totalStudents > 0 ? (active_students / totalStudents) * 100 : 0;

    const row = await this.prisma.cohort_progression.upsert({
      where: { cohort_id_week_number: { cohort_id: cohortId, week_number: weekNumber } },
      create: {
        cohort_id: cohortId,
        week_number: weekNumber,
        total_xp,
        average_level: avg_level,
        total_market_share,
        completion_rate,
        active_students,
      },
      update: {
        total_xp,
        average_level: avg_level,
        total_market_share,
        completion_rate,
        active_students,
        updated_at: new Date(),
      },
    });

    return {
      id: row.id,
      cohort_id: row.cohort_id,
      week_number: row.week_number,
      total_xp: row.total_xp,
      average_level: Number(row.average_level),
      total_market_share: row.total_market_share,
      completion_rate: Number(row.completion_rate),
      active_students: row.active_students,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async getStudentMetrics(cohortId: string) {
    await this.findOne(cohortId);
    const classes = await this.prisma.renamedclass.findMany({
      where: { cohort_id: cohortId },
      select: { id: true },
    });
    const classIds = classes.map((c) => c.id);

    const enrollments = await this.prisma.enrolled_students.findMany({
      where: { class_id: { in: classIds }, is_cancelled: false },
      select: {
        student_id: true,
        xp: true,
        level: true,
        market_share: true,
        available_points: true,
        users: { select: { id: true, name: true, email: true } },
      },
    });

    const byStudent = new Map<
      string,
      {
        id: string;
        name: string | null;
        email: string;
        total_xp: number;
        total_market_share: number;
        total_available_points: number;
        avg_level: number;
        class_count: number;
        levels: number[];
      }
    >();

    for (const e of enrollments) {
      const key = e.student_id;
      if (!byStudent.has(key)) {
        byStudent.set(key, {
          id: e.users.id,
          name: e.users.name,
          email: e.users.email,
          total_xp: 0,
          total_market_share: 0,
          total_available_points: 0,
          avg_level: 0,
          class_count: 0,
          levels: [],
        });
      }
      const s = byStudent.get(key)!;
      s.total_xp += e.xp ?? 0;
      s.total_market_share += e.market_share ?? 0;
      s.total_available_points += e.available_points ?? 0;
      s.levels.push(e.level ?? 1);
      s.class_count += 1;
    }

    return Array.from(byStudent.values()).map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      total_xp: s.total_xp,
      total_market_share: s.total_market_share,
      total_available_points: s.total_available_points,
      avg_level: s.levels.length ? s.levels.reduce((a, b) => a + b, 0) / s.levels.length : 0,
      class_count: s.class_count,
    }));
  }

  async getStudentClassEnrollments(cohortId: string, studentId: string) {
    await this.findOne(cohortId);
    const classes = await this.prisma.renamedclass.findMany({
      where: { cohort_id: cohortId },
      orderBy: { start_time: 'asc' },
      select: {
        id: true,
        name: true,
        meeting_link: true,
        start_time: true,
        end_time: true,
        is_active: true,
        enrolled_students: {
          where: { student_id: studentId },
          select: {
            id: true,
            xp: true,
            level: true,
            market_share: true,
            available_points: true,
            is_cancelled: true,
            archtypes: { select: { id: true, title: true, sub_title: true, playstyle: true } },
          },
        },
      },
    });

    return classes.map((c) => {
      const enrollment = c.enrolled_students[0] ?? null;
      return {
        id: c.id,
        name: c.name,
        meeting_link: c.meeting_link,
        start_time: c.start_time,
        end_time: c.end_time,
        is_active: c.is_active,
        enrolled: !!enrollment && !enrollment.is_cancelled,
        xp: enrollment?.xp ?? null,
        level: enrollment?.level ?? null,
        market_share: enrollment?.market_share ?? null,
        available_points: enrollment?.available_points ?? null,
        archetype: enrollment?.archtypes ?? null,
      };
    });
  }

  async cancelEnrollment(
    cohortId: string,
    classId: string,
    studentId: string,
    teacherId: string,
  ): Promise<void> {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: { teacher_id: true },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });

    const cls = await this.prisma.renamedclass.findUnique({
      where: { id: classId },
      select: { cohort_id: true },
    });
    if (!cls) throw new NotFoundException({ success: false, message: 'Class not found' });
    if (cls.cohort_id !== cohortId)
      throw new BadRequestException({
        success: false,
        message: 'Class does not belong to this cohort',
      });

    const enrollment = await this.prisma.enrolled_students.findUnique({
      where: { student_id_class_id: { student_id: studentId, class_id: classId } },
    });
    if (!enrollment)
      throw new NotFoundException({ success: false, message: 'Enrollment not found' });

    await this.prisma.enrolled_students.update({
      where: { student_id_class_id: { student_id: studentId, class_id: classId } },
      data: { is_cancelled: true },
    });
  }

  async computeProgression(
    cohortId: string,
    teacherId: string,
    weekNumber?: number,
  ): Promise<CohortProgressionDto> {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: { teacher_id: true },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });

    const wn = weekNumber ?? this.currentWeekNumber();
    return this.computeAndSaveProgression(cohortId, wn);
  }

  private currentWeekNumber(): number {
    const start = new Date('2024-01-01').getTime();
    return Math.ceil((Date.now() - start) / (7 * 24 * 60 * 60 * 1000));
  }

  async isEnrolled(cohortId: string, studentId: string): Promise<boolean> {
    const row = await this.prisma.cohort_students.findUnique({
      where: { cohort_id_student_id: { cohort_id: cohortId, student_id: studentId } },
    });
    return !!row;
  }

  async isFull(cohortId: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const cohort = await lockCohort(tx, cohortId);
      return cohort.max_students <= 0 || (await occupiedSeats(tx, cohortId)) >= cohort.max_students;
    });
  }

  // ─── Session Progression ────────────────────────────────────────────────────

  async getSessions(cohortId: string, teacherId: string) {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: { teacher_id: true, total_sessions: true, current_week: true },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });

    const sessions = await this.prisma.cohort_sessions.findMany({
      where: { cohort_id: cohortId },
      orderBy: { week_number: 'asc' },
    });
    return { sessions, total_sessions: cohort.total_sessions, current_week: cohort.current_week };
  }

  async advanceSession(cohortId: string, teacherId: string) {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: { teacher_id: true, total_sessions: true, current_week: true },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });

    const nextWeek = cohort.current_week + 1;
    if (nextWeek > cohort.total_sessions) {
      throw new BadRequestException({ success: false, message: 'All sessions already completed' });
    }

    // Lock current week session if it exists
    if (cohort.current_week > 0) {
      await this.prisma.cohort_sessions.upsert({
        where: { cohort_id_week_number: { cohort_id: cohortId, week_number: cohort.current_week } },
        create: {
          cohort_id: cohortId,
          week_number: cohort.current_week,
          locked_at: new Date(),
          completed_at: new Date(),
        },
        update: { locked_at: new Date(), completed_at: new Date(), updated_at: new Date() },
      });
    }

    // Unlock next week session
    await this.prisma.cohort_sessions.upsert({
      where: { cohort_id_week_number: { cohort_id: cohortId, week_number: nextWeek } },
      create: { cohort_id: cohortId, week_number: nextWeek, unlocked_at: new Date() },
      update: {
        unlocked_at: new Date(),
        locked_at: null,
        completed_at: null,
        updated_at: new Date(),
      },
    });

    const updated = await this.prisma.cohorts.update({
      where: { id: cohortId },
      data: { current_week: nextWeek, updated_at: new Date() },
      select: COHORT_SELECT,
    });
    return this.mapCohort(updated);
  }

  // ─── Materials ───────────────────────────────────────────────────────────────

  async getMaterials(cohortId: string) {
    await this.findOne(cohortId);
    return this.prisma.cohort_materials.findMany({
      where: { cohort_id: cohortId },
      orderBy: { created_at: 'desc' },
      select: { id: true, file_name: true, file_url: true, uploaded_by: true, created_at: true },
    });
  }

  async addMaterial(cohortId: string, teacherId: string, fileName: string, fileUrl: string) {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: { teacher_id: true },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });

    return this.prisma.cohort_materials.create({
      data: { cohort_id: cohortId, file_name: fileName, file_url: fileUrl, uploaded_by: teacherId },
      select: { id: true, file_name: true, file_url: true, uploaded_by: true, created_at: true },
    });
  }

  async deleteMaterial(cohortId: string, materialId: string, teacherId: string) {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: { teacher_id: true },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });

    const material = await this.prisma.cohort_materials.findUnique({ where: { id: materialId } });
    if (!material || material.cohort_id !== cohortId) {
      throw new NotFoundException({ success: false, message: 'Material not found' });
    }
    await this.prisma.cohort_materials.delete({ where: { id: materialId } });
  }

  // ─── Recordings ──────────────────────────────────────────────────────────────

  async getRecordings(cohortId: string) {
    await this.findOne(cohortId);
    return this.prisma.cohort_recordings.findMany({
      where: { cohort_id: cohortId },
      orderBy: { created_at: 'desc' },
      select: { id: true, title: true, recording_url: true, created_at: true },
    });
  }

  async addRecording(cohortId: string, teacherId: string, title: string, recordingUrl: string) {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: { teacher_id: true },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });

    return this.prisma.cohort_recordings.create({
      data: { cohort_id: cohortId, title, recording_url: recordingUrl },
      select: { id: true, title: true, recording_url: true, created_at: true },
    });
  }

  async deleteRecording(cohortId: string, recordingId: string, teacherId: string) {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: { teacher_id: true },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });

    const recording = await this.prisma.cohort_recordings.findUnique({
      where: { id: recordingId },
    });
    if (!recording || recording.cohort_id !== cohortId) {
      throw new NotFoundException({ success: false, message: 'Recording not found' });
    }
    await this.prisma.cohort_recordings.delete({ where: { id: recordingId } });
  }

  // ─── Schedules ───────────────────────────────────────────────────────────────

  async getSchedules(cohortId: string): Promise<ScheduleItemDto[]> {
    await this.findOne(cohortId);
    return this.prisma.cohort_schedules.findMany({
      where: { cohort_id: cohortId },
      orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
    });
  }

  async createSchedule(
    cohortId: string,
    dto: CreateScheduleDto,
    teacherId: string,
  ): Promise<ScheduleItemDto> {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: { teacher_id: true },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });

    return this.prisma.cohort_schedules.create({
      data: {
        cohort_id: cohortId,
        day_of_week: dto.day_of_week,
        start_time: dto.start_time,
        end_time: dto.end_time,
      },
    });
  }

  async updateSchedule(
    cohortId: string,
    scheduleId: string,
    dto: UpdateScheduleDto,
    teacherId: string,
  ): Promise<ScheduleItemDto> {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: { teacher_id: true },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });

    const schedule = await this.prisma.cohort_schedules.findUnique({ where: { id: scheduleId } });
    if (!schedule || schedule.cohort_id !== cohortId)
      throw new NotFoundException({ success: false, message: 'Schedule not found' });

    return this.prisma.cohort_schedules.update({
      where: { id: scheduleId },
      data: {
        ...(dto.day_of_week !== undefined && { day_of_week: dto.day_of_week }),
        ...(dto.start_time !== undefined && { start_time: dto.start_time }),
        ...(dto.end_time !== undefined && { end_time: dto.end_time }),
        updated_at: new Date(),
      },
    });
  }

  async deleteSchedule(cohortId: string, scheduleId: string, teacherId: string): Promise<void> {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: { teacher_id: true },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });

    const schedule = await this.prisma.cohort_schedules.findUnique({ where: { id: scheduleId } });
    if (!schedule || schedule.cohort_id !== cohortId)
      throw new NotFoundException({ success: false, message: 'Schedule not found' });

    await this.prisma.cohort_schedules.delete({ where: { id: scheduleId } });
  }

  async generateClasses(
    cohortId: string,
    teacherId: string,
    dto?: GenerateClassesDto,
  ): Promise<{ created: number; skipped: number }> {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: {
        teacher_id: true,
        start_date: true,
        end_date: true,
        name: true,
        timezone: true,
        zoom_meeting_id: true,
        zoom_join_url: true,
        zoom_passcode: true,
      },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });
    if (!cohort.start_date || !cohort.end_date)
      throw new BadRequestException({
        success: false,
        message: 'Cohort must have start_date and end_date to generate classes',
      });

    const schedules = await this.prisma.cohort_schedules.findMany({
      where: { cohort_id: cohortId },
    });
    if (schedules.length === 0)
      throw new BadRequestException({
        success: false,
        message: 'No active schedules found for this cohort',
      });

    // Schedule times ("HH:MM") are wall-clock times in the cohort's own timezone.
    // We must convert them to UTC instants relative to that zone (not the server's
    // local zone) so generated class times stay in sync regardless of where this
    // process runs. Falls back to DEFAULT_COHORT_TIMEZONE for cohorts created
    // before timezone capture — see schedule-occurrence.util.ts for why this is
    // configurable rather than a hardcoded assumption.
    const { zone, usedFallback } = resolveCohortTimezone(cohort.timezone);
    if (usedFallback) {
      this.logger.warn(
        `generateClasses: cohort ${cohortId} has no valid timezone saved — falling back to "${zone}". ` +
          `Generated class times may not match the teacher's intended local time.`,
      );
    }

    const namePrefix = dto?.name_prefix ?? cohort.name;
    // start_date/end_date are stored as UTC-midnight instants representing a
    // calendar date; read them back as UTC so the calendar day is unaffected by
    // the server's local timezone.
    const startDate = DateTime.fromJSDate(cohort.start_date, { zone: 'utc' }).startOf('day');
    const endDate = DateTime.fromJSDate(cohort.end_date, { zone: 'utc' }).startOf('day');

    // Collect all occurrences from every active schedule
    type Occurrence = { start_time: Date; end_time: Date };
    const allOccurrences: Occurrence[] = [];

    for (const schedule of schedules) {
      const dayDiff = (schedule.day_of_week - (startDate.weekday % 7) + 7) % 7;
      const first = startDate.plus({ days: dayDiff });

      let current = first;
      while (current <= endDate) {
        const calendarDate = { year: current.year, month: current.month, day: current.day };
        const startInstant = toUtcInstant(calendarDate, schedule.start_time, zone);
        const endInstant = toUtcInstant(calendarDate, schedule.end_time, zone);

        this.logger.debug(
          `generateClasses: cohort=${cohortId} zone=${zone} localDate=${current.toISODate()} ` +
            `${schedule.start_time}-${schedule.end_time} -> UTC ${startInstant.toISOString()}..${endInstant.toISOString()}`,
        );

        allOccurrences.push({ start_time: startInstant, end_time: endInstant });

        current = current.plus({ days: 7 });
      }
    }

    allOccurrences.sort((a, b) => a.start_time.getTime() - b.start_time.getTime());

    // Find existing classes to avoid duplicates
    const existingClasses = await this.prisma.renamedclass.findMany({
      where: {
        cohort_id: cohortId,
        start_time: { in: allOccurrences.map((o) => o.start_time) },
      },
      select: { start_time: true },
    });
    const existingSet = new Set(
      existingClasses.map((c) => c.start_time?.toISOString()).filter(Boolean),
    );

    // ── Find enrollment source before creating any classes ──────────────────────
    const sourceClass = await this.prisma.renamedclass.findFirst({
      where: { cohort_id: cohortId, enrolled_students: { some: {} } },
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

    const sourceEnrollments = sourceClass?.enrolled_students ?? [];

    // Fresh fallback: pull from cohort_students when no previous class data
    const cohortStudents =
      sourceEnrollments.length === 0
        ? await this.prisma.cohort_students.findMany({
            where: { cohort_id: cohortId, is_active: true },
            select: {
              student_id: true,
              current_xp: true,
              current_level: true,
              current_market_share: true,
            },
          })
        : [];

    const allAttributes =
      sourceEnrollments.length === 0 && cohortStudents.length > 0
        ? await this.prisma.attributes.findMany({ select: { id: true, value: true } })
        : [];

    // ── Create classes ────────────────────────────────────────────────────────
    let created = 0;
    let skipped = 0;
    let sessionNumber = 0;
    const newClassIds: string[] = [];

    for (let i = 0; i < allOccurrences.length; i++) {
      const occ = allOccurrences[i];
      if (existingSet.has(occ.start_time.toISOString())) {
        skipped++;
        continue;
      }

      sessionNumber++;
      const sessionName = `${namePrefix} - Class ${sessionNumber}`;

      // Every class reuses the cohort's own Zoom meeting (one persistent
      // room per cohort) — never the shared DEFAULT_MEETING_* room. A
      // cohort created before Zoom integration, or one whose Zoom creation
      // previously failed, has no zoom_meeting_id yet; such classes are
      // left empty here rather than silently falling back to a default.
      const newClass = await this.prisma.renamedclass.create({
        data: {
          meeting_id: cohort.zoom_meeting_id ?? '',
          name: sessionName,
          meeting_link: cohort.zoom_join_url ?? '',
          passcode: cohort.zoom_passcode,
          start_time: occ.start_time,
          end_time: occ.end_time,
          instructor_id: teacherId,
          cohort_id: cohortId,
        },
      });
      newClassIds.push(newClass.id);
      created++;
    }

    // ── Enroll students into every newly created class ────────────────────────
    for (const classId of newClassIds) {
      if (sourceEnrollments.length > 0) {
        // Copy XP/MS/level/CEO/skills/perks from most recent previous class
        await this.prisma.enrolled_students.createMany({
          data: sourceEnrollments.map((src) => ({
            student_id: src.student_id,
            class_id: classId,
            xp: src.xp ?? 0,
            level: src.level ?? 1,
            market_share: src.market_share ?? 0,
            archtype_id: src.archtype_id,
            available_points: src.available_points ?? 10,
            skill_unlocked: src.skill_unlocked ?? true,
          })),
          skipDuplicates: true,
        });

        const newEnrollments = await this.prisma.enrolled_students.findMany({
          where: { class_id: classId },
          select: { id: true, student_id: true },
        });
        const enrollMap = new Map(newEnrollments.map((e) => [e.student_id, e.id]));

        const attrData = sourceEnrollments.flatMap((src) => {
          const enrollId = enrollMap.get(src.student_id);
          if (!enrollId) return [];
          return src.student_attributes.map((a) => ({
            enrollment_id: enrollId,
            attribute_id: a.attribute_id,
            value: a.value,
          }));
        });
        if (attrData.length > 0) {
          await this.prisma.student_attributes.createMany({ data: attrData });
        }

        const perkData = sourceEnrollments.flatMap((src) => {
          const enrollId = enrollMap.get(src.student_id);
          if (!enrollId) return [];
          return src.student_perks.map((sp) => ({
            enrollment_id: enrollId,
            perk_id: sp.perk_id,
            is_unlocked: sp.is_unlocked,
            is_used: sp.is_used,
            is_approved: sp.is_approved,
            perk_status: sp.perk_status,
          }));
        });
        if (perkData.length > 0) {
          await this.prisma.student_perks.createMany({ data: perkData });
        }
      } else if (cohortStudents.length > 0) {
        // First batch: fresh enrollment from cohort_students
        await this.prisma.enrolled_students.createMany({
          data: cohortStudents.map((cs) => ({
            student_id: cs.student_id,
            class_id: classId,
            xp: cs.current_xp ?? 0,
            level: cs.current_level ?? 1,
            market_share: Number(cs.current_market_share ?? 0),
            available_points: 10,
            skill_unlocked: true,
          })),
          skipDuplicates: true,
        });

        if (allAttributes.length > 0) {
          const newEnrollments = await this.prisma.enrolled_students.findMany({
            where: { class_id: classId },
            select: { id: true },
          });
          await this.prisma.student_attributes.createMany({
            data: newEnrollments.flatMap((e) =>
              allAttributes.map((attr) => ({
                enrollment_id: e.id,
                attribute_id: attr.id,
                value: attr.value ?? 0,
              })),
            ),
          });
        }
      }
    }

    return { created, skipped };
  }

  // ─── Carry-over Progression ──────────────────────────────────────────────────

  async carryOverProgression(cohortId: string, teacherId: string) {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: { teacher_id: true },
    });
    if (!cohort) throw new NotFoundException({ success: false, message: 'Cohort not found' });
    if (cohort.teacher_id !== teacherId)
      throw new ForbiddenException({ success: false, message: 'Forbidden' });

    // Get all cohort classes and their enrollments
    const classes = await this.prisma.renamedclass.findMany({
      where: { cohort_id: cohortId },
      select: { id: true },
    });
    const classIds = classes.map((c) => c.id);

    const enrollments = await this.prisma.enrolled_students.findMany({
      where: { class_id: { in: classIds }, is_cancelled: false },
      select: { student_id: true, xp: true, level: true, market_share: true },
    });

    // Aggregate per student
    const byStudent = new Map<
      string,
      { xp: number; level: number; market_share: number; count: number }
    >();
    for (const e of enrollments) {
      const cur = byStudent.get(e.student_id) ?? { xp: 0, level: 0, market_share: 0, count: 0 };
      cur.xp += e.xp ?? 0;
      cur.level += e.level ?? 1;
      cur.market_share += e.market_share ?? 0;
      cur.count += 1;
      byStudent.set(e.student_id, cur);
    }

    // Update cohort_students with aggregated data
    await Promise.all(
      Array.from(byStudent.entries()).map(([studentId, data]) =>
        this.prisma.cohort_students.update({
          where: { cohort_id_student_id: { cohort_id: cohortId, student_id: studentId } },
          data: {
            current_xp: data.xp,
            current_level: data.count > 0 ? Math.round(data.level / data.count) : 1,
            current_market_share: data.count > 0 ? data.market_share / data.count : 0,
          },
        }),
      ),
    );

    return { updated: byStudent.size };
  }
}
