import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CohortService } from './cohort.service';
import {
  AddMaterialDto,
  AddRecordingDto,
  AddStudentDto,
  CohortDetailResponseDto,
  CohortListResponseDto,
  ComputeProgressionDto,
  CreateCohortDto,
  CreateCohortResponseDto,
  CreateScheduleDto,
  EnrollStudentsDto,
  GenerateClassesDto,
  UpdateCohortDto,
  UpdateScheduleDto,
} from './dto/cohort.dto';
import { SupabaseAuthGuard } from '@utils/common/guards/supabase-auth.guard';
import { RolesGuard } from '@utils/common/guards/role.guard';
import { Roles } from '@utils/common/decorators/role.decorator';
import { Role } from '@utils/common/enum/roles.enum';
import { AuthenticatedRequest } from '@utils/common/interfaces/interfaces';

@ApiTags('cohorts')
@Controller('cohorts')
export class CohortController {
  constructor(private readonly cohortService: CohortService) {}

  @Get('public')
  @ApiOperation({ summary: 'List public active cohorts for registration' })
  async findPublic(): Promise<CohortListResponseDto> {
    const data = await this.cohortService.findAll();
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List cohorts for the authenticated teacher' })
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  async findAll(@Req() req: AuthenticatedRequest): Promise<CohortListResponseDto> {
    const data = await this.cohortService.findAllByTeacher(req.user.id);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a cohort by ID' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<CohortDetailResponseDto> {
    const data = await this.cohortService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Create a new cohort with its own Zoom meeting (teacher only)' })
  async create(
    @Body() dto: CreateCohortDto,
    @Req() req: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<CreateCohortResponseDto> {
    const data = await this.cohortService.create(dto, req.user.id, idempotencyKey);
    return { success: true, data };
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update a cohort (teacher only)' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCohortDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CohortDetailResponseDto> {
    const data = await this.cohortService.update(id, dto, req.user.id);
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Archive a cohort (teacher only)' })
  async archive(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; message: string }> {
    await this.cohortService.archive(id, req.user.id);
    return { success: true, message: 'Cohort archived successfully' };
  }

  @Post(':id/students')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Add a student to a cohort' })
  async addStudent(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddStudentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const data = await this.cohortService.addStudent(id, dto.student_id, req.user.id);
    return { success: true, data };
  }

  @Delete(':id/students/:studentId')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Remove a student from a cohort' })
  async removeStudent(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('studentId', new ParseUUIDPipe()) studentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.cohortService.removeStudent(id, studentId, req.user.id);
    return { success: true, message: 'Student removed from cohort' };
  }

  @Get(':id/students')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'List students in a cohort' })
  async getStudents(@Param('id', new ParseUUIDPipe()) id: string) {
    const data = await this.cohortService.getStudents(id);
    return { success: true, data };
  }

  @Get(':id/classes')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'List classes for a cohort' })
  async getClasses(@Param('id', new ParseUUIDPipe()) id: string) {
    const data = await this.cohortService.getClasses(id);
    return { success: true, data };
  }

  @Get(':id/classes/:classId/students')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'List students enrolled in a specific class within a cohort' })
  async getClassEnrolledStudents(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
  ) {
    const data = await this.cohortService.getClassEnrolledStudents(id, classId);
    return { success: true, data };
  }

  @Get(':id/classes/:classId/players')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Student)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'List cohort players and their CEO for an enrolled student' })
  async getCohortPlayers(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const data = await this.cohortService.getCohortPlayers(id, classId, req.user.id);
    return { success: true, data };
  }

  @Post(':id/classes/:classId/enroll')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Enroll students from cohort into a class' })
  async enrollStudents(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Body() dto: EnrollStudentsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const data = await this.cohortService.enrollStudents(id, classId, dto.student_ids, req.user.id);
    return { success: true, data };
  }

  @Get(':id/progression')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get cohort progression data' })
  async getProgression(@Param('id', new ParseUUIDPipe()) id: string) {
    const data = await this.cohortService.getProgression(id);
    return { success: true, data };
  }

  @Delete(':id/classes/:classId/students/:studentId')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Cancel a student enrollment in a class' })
  async cancelEnrollment(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Param('studentId', new ParseUUIDPipe()) studentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.cohortService.cancelEnrollment(id, classId, studentId, req.user.id);
    return { success: true, message: 'Enrollment cancelled' };
  }

  @Post(':id/progression/compute')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Compute and save cohort progression for a week' })
  async computeProgression(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ComputeProgressionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const data = await this.cohortService.computeProgression(id, req.user.id, dto.week_number);
    return { success: true, data };
  }

  @Get(':id/students/metrics')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get per-student aggregate metrics for a cohort' })
  async getStudentMetrics(@Param('id', new ParseUUIDPipe()) id: string) {
    const data = await this.cohortService.getStudentMetrics(id);
    return { success: true, data };
  }

  @Get(':id/my-classes')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Student)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Get cohort classes with student's enrollment status" })
  async getMyClasses(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const data = await this.cohortService.getStudentClassEnrollments(id, req.user.id);
    return { success: true, data };
  }

  // ─── Session Progression ────────────────────────────────────────────────────

  @Get(':id/sessions')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get session progression for a cohort' })
  async getSessions(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const data = await this.cohortService.getSessions(id, req.user.id);
    return { success: true, data };
  }

  @Patch(':id/session')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Advance cohort to next week/session' })
  async advanceSession(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const data = await this.cohortService.advanceSession(id, req.user.id);
    return { success: true, data };
  }

  @Post(':id/continue')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Carry over student progression into cohort_students table' })
  async carryOverProgression(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const data = await this.cohortService.carryOverProgression(id, req.user.id);
    return { success: true, data };
  }

  // ─── Schedules ───────────────────────────────────────────────────────────────

  @Get(':id/schedules')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'List recurring schedules for a cohort' })
  async getSchedules(@Param('id', new ParseUUIDPipe()) id: string) {
    const data = await this.cohortService.getSchedules(id);
    return { success: true, data };
  }

  @Post(':id/schedules')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Add a recurring schedule entry to a cohort' })
  async createSchedule(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateScheduleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const data = await this.cohortService.createSchedule(id, dto, req.user.id);
    return { success: true, data };
  }

  @Patch(':id/schedules/:scheduleId')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update a recurring schedule entry' })
  async updateSchedule(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('scheduleId', new ParseUUIDPipe()) scheduleId: string,
    @Body() dto: UpdateScheduleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const data = await this.cohortService.updateSchedule(id, scheduleId, dto, req.user.id);
    return { success: true, data };
  }

  @Delete(':id/schedules/:scheduleId')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete a recurring schedule entry' })
  async deleteSchedule(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('scheduleId', new ParseUUIDPipe()) scheduleId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.cohortService.deleteSchedule(id, scheduleId, req.user.id);
    return { success: true, message: 'Schedule deleted' };
  }

  @Post(':id/schedules/generate')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Auto-generate classes from cohort schedules',
    description:
      'Loops through every week between cohort start_date and end_date, creates one class per active schedule entry. Skips dates that already have a class at the same start_time.',
  })
  async generateClasses(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: GenerateClassesDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const data = await this.cohortService.generateClasses(id, req.user.id, dto);
    return { success: true, data };
  }

  // ─── Materials ───────────────────────────────────────────────────────────────

  @Get(':id/materials')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'List materials for a cohort' })
  async getMaterials(@Param('id', new ParseUUIDPipe()) id: string) {
    const data = await this.cohortService.getMaterials(id);
    return { success: true, data };
  }

  @Post(':id/materials')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Add a material to a cohort' })
  async addMaterial(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddMaterialDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const data = await this.cohortService.addMaterial(id, req.user.id, dto.file_name, dto.file_url);
    return { success: true, data };
  }

  @Delete(':id/materials/:materialId')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete a material from a cohort' })
  async deleteMaterial(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('materialId', new ParseUUIDPipe()) materialId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.cohortService.deleteMaterial(id, materialId, req.user.id);
    return { success: true, message: 'Material deleted' };
  }

  // ─── Recordings ──────────────────────────────────────────────────────────────

  @Get(':id/recordings')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'List recordings for a cohort' })
  async getRecordings(@Param('id', new ParseUUIDPipe()) id: string) {
    const data = await this.cohortService.getRecordings(id);
    return { success: true, data };
  }

  @Post(':id/recordings')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Add a recording to a cohort' })
  async addRecording(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddRecordingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const data = await this.cohortService.addRecording(
      id,
      req.user.id,
      dto.title,
      dto.recording_url,
    );
    return { success: true, data };
  }

  @Delete(':id/recordings/:recordingId')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(Role.Teacher)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete a recording from a cohort' })
  async deleteRecording(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('recordingId', new ParseUUIDPipe()) recordingId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.cohortService.deleteRecording(id, recordingId, req.user.id);
    return { success: true, message: 'Recording deleted' };
  }
}
