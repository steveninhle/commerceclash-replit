import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '@utils/common/decorators/role.decorator';
import {
  ApiAddStudentByTeacher,
  // ApiAddSkill,
  ApiDeleteSkill,
  ApiGetAllStudents,
  // ApiGetSkills,
  ApiGetStudent,
  ApiUpdateSkill,
  ApiUpdateStudent,
  ApiUpdateStudentStatus,
} from './docs/api-docs.decorator';
import { SupabaseAuthGuard } from '@utils/common/guards/supabase-auth.guard';
import { RolesGuard } from '@utils/common/guards/role.guard';
import { Role } from '@utils/common/enum/roles.enum';
import { UpdateStudentRequestDto, UpdateStudentResponseDto } from './dto/update-student.dto';
import { GetStudentResponseDto } from '../student/dto/get-student-response.dto';
import { TeacherService } from './teacher.service';
import { GetStudentsForTeacherResponseDto } from './dto/get-all-student.dto';
import { AuthenticatedRequest } from '@utils/common/interfaces/interfaces';
import {
  UpdateStudentStatusRequestDto,
  UpdateStudentStatusResponseDto,
} from './dto/update-student-status.dto';
import { DeleteSkillResponseDto } from './dto/delete-skill/delete-skill-response.dto';
// import { GetSkillsResponseDto } from './dto/get-skills/get-skills-response.dto';
import { EditSkillRequestDto } from './dto/edit-skill/edit-skill-request.dto';
import { EditSkillResponseDto } from './dto/edit-skill/edit-skill-response.dto';
import { CreateStudentDto } from './dto/create-student.dto';
// import { AddSkillRequestDto } from './dto/add-skill/add-skill-request.dto';
// import { AddSkillResponseDto } from './dto/add-skill/add-skill-response.dto';

@Controller('teacher')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(Role.Teacher)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get(':tid/students')
  @ApiGetAllStudents()
  async getAllStudents(): Promise<GetStudentsForTeacherResponseDto> {
    return await this.teacherService.getAllStudents();
  }

  @Post(':tid/students')
  @ApiAddStudentByTeacher()
  async createStudent(
    @Param('tid', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateStudentDto,
  ) {
    if (req.user.id !== id) {
      throw new ForbiddenException({
        success: false,
        message: 'You are not authorized to access this resource.',
      });
    }
    return this.teacherService.createStudent(id, dto);
  }
  @Get(':tid/students/:sid')
  @ApiGetStudent()
  async getStudent(
    @Param('tid', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
    @Param('sid', new ParseUUIDPipe()) studentId: string,
  ): Promise<GetStudentResponseDto> {
    if (req.user.id !== id) {
      throw new ForbiddenException({
        success: true,
        message: 'You are not authorized to access this resource.',
      });
    }
    return this.teacherService.getStudent({ studentId });
  }

  @Patch(':tid/students/:sid')
  @ApiUpdateStudent()
  async updateStudent(
    @Param('tid', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
    @Param('sid', new ParseUUIDPipe()) studentId: string,
    @Body() dto: UpdateStudentRequestDto,
  ): Promise<UpdateStudentResponseDto> {
    if (req.user.id !== id) {
      throw new ForbiddenException({
        success: true,
        message: 'You are not authorized to access this resource.',
      });
    }
    return this.teacherService.updateStudent(studentId, dto);
  }
  @Patch(':tid/toggle-student-status/:sid')
  @ApiUpdateStudentStatus()
  async updateStudentStatus(
    @Param('tid', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
    @Param('sid', new ParseUUIDPipe()) studentId: string,
    @Body() dto: UpdateStudentStatusRequestDto,
  ): Promise<UpdateStudentStatusResponseDto> {
    if (req.user.id !== id) {
      throw new ForbiddenException({
        success: true,
        message: 'You are not authorized to access this resource.',
      });
    }
    return this.teacherService.updateStudentStatus(studentId, dto);
  }
  // @Get(':cid/classes/skills')
  // @Roles(Role.Student, Role.Teacher)
  // @ApiGetSkills()
  // async getSkills(
  //   @Param('cid', new ParseUUIDPipe()) classId: string,
  // ): Promise<GetSkillsResponseDto> {
  //   return this.teacherService.getSkills(classId) as Promise<GetSkillsResponseDto>;
  // }

  // @Post(':cid/classes/add-skills')
  // @ApiAddSkill()
  // @Roles(Role.Teacher)
  // async addClassSkills(
  //   @Param('cid', new ParseUUIDPipe()) classId: string,
  //   @Body() dto: AddSkillRequestDto,
  // ): Promise<AddSkillResponseDto> {
  //   return this.teacherService.addSkill(classId, dto);
  // }

  @Patch(':cid/edit-skills/:skillId')
  @ApiUpdateSkill()
  @Roles(Role.Teacher)
  async updateSkills(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Param('skillId', new ParseUUIDPipe()) skillId: string,
    @Body() dto: EditSkillRequestDto,
  ): Promise<EditSkillResponseDto> {
    return this.teacherService.editSkill(classId, skillId, dto);
  }

  @Delete(':tid/classes/:cid/skill/:skillId')
  @Roles(Role.Teacher)
  @ApiDeleteSkill()
  async deleteSkill(
    @Param('tid', new ParseUUIDPipe()) teacherId: string,
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Param('skillId', new ParseUUIDPipe()) skillId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<DeleteSkillResponseDto> {
    if (req.user.id !== teacherId) {
      throw new ForbiddenException({
        success: false,
        message: 'Your not allowed to access this resource',
      });
    }
    return this.teacherService.deleteSkill(classId, skillId);
  }
}
