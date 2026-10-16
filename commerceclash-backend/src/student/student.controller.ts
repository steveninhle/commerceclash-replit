import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { SupabaseAuthGuard } from '@utils/common/guards/supabase-auth.guard';
import { RolesGuard } from '@utils/common/guards/role.guard';
import { Role } from '@utils/common/enum/roles.enum';
import { Roles } from '@utils/common/decorators/role.decorator';
import { GetStudentResponseDto } from './dto/get-student-response.dto';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiDeleteStudent,
  ApiGetOwnClasses,
  ApiGetProfile,
  ApiGetStudentSkills,
  ApiUpdateSkill,
  ApiResetSkills,
  ApiSkillShifting,
  ApiSkillsStatus,
  ApiUnenroll,
} from './docs/api-docs.decorator';
import { GetOwnClassesResponseDto } from './dto/get-own-classes.dto';
import { UnenrollResponseDto } from './dto/unenroll-class.dto';
import { ResetSkillsResponseDto } from './dto/reset-skills/reset-skills-response.dto';
import { UpsertSkillRequestDto } from './dto/upsert-skill/upsert-skill-request.dto';
import { UpsertSkillResponseDto } from './dto/upsert-skill/upsert-skill-response.dto';
import { GetStudentSkillsResponseDto } from './dto/get-student-skills/get-student-skills-response.dto';
import { UserIsSelfGuard } from '@utils/common/guards/user-is-self.guard';
import { ShiftSkillPointRequest } from './dto/shift-skill-points.dto.ts/shift-skill-points-request.dto';
import { ApiResponse, AuthenticatedRequest } from '@utils/common/interfaces/interfaces';
import { PointsShiftingResponse } from './dto/point-shifting.dto';
import { AuthService } from 'src/auth/auth.service';
import { CohortService } from 'src/cohort/cohort.service';

@Controller('student')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@ApiTags('Student')
export class StudentController {
  private logger = new Logger(StudentController.name);
  constructor(
    private readonly studentService: StudentService,
    private readonly authService: AuthService,
    private readonly cohortService: CohortService,
  ) {}

  @Get(':sid')
  @Roles(Role.Student, Role.Teacher)
  @ApiGetProfile()
  async getProfile(@Param('sid', new ParseUUIDPipe()) id: string): Promise<GetStudentResponseDto> {
    return this.studentService.getProfile({ studentId: id });
  }

  @Get(':sid/classes')
  @Roles(Role.Student)
  @UseGuards(UserIsSelfGuard)
  @ApiGetOwnClasses()
  async getOwnClasses(
    @Param('sid', new ParseUUIDPipe()) studentId: string,
  ): Promise<GetOwnClassesResponseDto> {
    return this.studentService.getOwnClasses(studentId);
  }

  @Delete(':sid/classes/:cid/un-enroll')
  @Roles(Role.Student, Role.Teacher)
  @ApiUnenroll()
  async unenrollClass(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Param('sid', new ParseUUIDPipe()) studentId: string,
  ): Promise<UnenrollResponseDto> {
    return await this.studentService.unenrollClass(classId, studentId);
  }

  @Get(':sid/classes/:cid/skills')
  @Roles(Role.Student)
  @UseGuards(UserIsSelfGuard)
  @ApiGetStudentSkills()
  async getStudentSkills(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Param('sid', new ParseUUIDPipe()) studentId: string,
  ): Promise<GetStudentSkillsResponseDto> {
    this.logger.debug('studentid:', studentId);
    this.logger.debug('cid:', classId);
    return this.studentService.getStudentSkills(classId, studentId);
  }

  @Patch(':sid/classes/:cid/skills/:skillId')
  @ApiUpdateSkill()
  @Roles(Role.Student, Role.Teacher)
  async updateSkill(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Param('sid', new ParseUUIDPipe()) studentId: string,
    @Param('skillId', new ParseUUIDPipe()) skillId: string,
    @Body() dto: UpsertSkillRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<UpsertSkillResponseDto> {
    const role = req.user.role;
    return this.studentService.updateSkill(classId, studentId, skillId, dto, role);
  }

  @Post(':sid/classes/:cid/reset-skills')
  @Roles(Role.Student)
  @UseGuards(UserIsSelfGuard)
  @ApiResetSkills()
  async resetSkills(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Param('sid', new ParseUUIDPipe()) studentId: string,
  ): Promise<ResetSkillsResponseDto> {
    return this.studentService.resetSkills(classId, studentId);
  }

  @Get(':sid/classes/:cid/skills-status')
  @Roles(Role.Student)
  @UseGuards(UserIsSelfGuard)
  @ApiSkillsStatus()
  async skillsStatus(
    @Param('sid', new ParseUUIDPipe()) studentId: string,
    @Param('cid', new ParseUUIDPipe()) classId: string,
  ) {
    return this.studentService.skillsStatus(classId, studentId);
  }

  @Post(':sid/classes/:cid/confirm')
  @Roles(Role.Student)
  @UseGuards(UserIsSelfGuard)
  async confirmSkills(
    @Param('sid', new ParseUUIDPipe()) studentId: string,
    @Param('cid', new ParseUUIDPipe()) classId: string,
  ) {
    return this.studentService.confirmSkills(classId, studentId);
  }

  @Post(':sid/classes/:cid/shift-points')
  @Roles(Role.Student)
  @UseGuards(UserIsSelfGuard)
  @ApiSkillShifting()
  async skillShifting(
    @Param('sid', new ParseUUIDPipe()) studentId: string,
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Body() dto: ShiftSkillPointRequest[],
  ): Promise<PointsShiftingResponse> {
    return this.studentService.skillShifting(classId, studentId, dto);
  }

  @Get(':sid/cohorts')
  @UseGuards(SupabaseAuthGuard, RolesGuard, UserIsSelfGuard)
  @Roles(Role.Student)
  async getStudentCohorts(@Param('sid', new ParseUUIDPipe()) studentId: string) {
    const data = await this.cohortService.findStudentCohorts(studentId);
    return { success: true, data };
  }

  @Delete(':sid')
  @Roles(Role.Teacher)
  @ApiDeleteStudent()
  async deleteStudent(@Param('sid', new ParseUUIDPipe()) studentId: string): Promise<ApiResponse> {
    return this.authService.deleteAccount(studentId);
  }
}
