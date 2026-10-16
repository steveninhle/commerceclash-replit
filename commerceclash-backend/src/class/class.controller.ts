import {
  BadRequestException,
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
  Res,
  UseGuards,
} from '@nestjs/common';
import { ClassService } from './class.service';
import { JoinMeetingRequestDto } from './dto/join-meeting.dto';
import { CreateMeetingRequestDto } from './dto/create-meeting/create-meeting-request.dto';
import { Roles } from '@utils/common/decorators/role.decorator';
import { Role } from '@utils/common/enum/roles.enum';
import {
  ApiAssignCeo,
  ApiCreateClass,
  ApiCreateMeeting,
  ApiDeleteClass,
  ApiExportClassData,
  ApiGenerateSignature,
  ApiGetCeo,
  ApiGetClass,
  ApiGetStudentsForClass,
  ApiGetStudentsMarketShare,
  ApiGetStudentsSkills,
  ApiGetStudentsXp,
  ApiMomentOfGlory,
  ApiStudentAssignedCeo,
  ApiToggleClassStatus,
  ApiTrendsettter,
  ApiUpdateStudentsMarketShare,
  ApiUpdateStudentsXp,
  ApiUsePerk,
} from './docs/api-docs.decorator';
import { ApiResponse, AuthenticatedRequest } from '@utils/common/interfaces/interfaces';
import { ApiCookieAuth } from '@nestjs/swagger';
import { CreateClassRequestDto } from './dto/create-class/create-class.dto';
import { CreateClassResponseDto } from './dto/create-class/create-class-response.dto';
import { MeetingResponseDto } from './dto/generate-meeting-jwt-response.dto';
import { ZoomAuthGuard, ZoomRequest } from '@utils/common/guards/zoom-auth.gurad';
import { GetClassResponseDto } from './dto/get-class/get-class-response.dto';
import { GetClassRequestDto } from './dto/get-class/get-class-request.dto';
import { GetStudentForClassResponseDto } from './dto/get-student-for-class/get-student-for-class-response.dto';
import { SupabaseAuthGuard } from '@utils/common/guards/supabase-auth.guard';
import { RolesGuard } from '@utils/common/guards/role.guard';
import { toggleClassResponse } from './dto/toggle-class-status-response.dto';
import { AssignCeoDto } from './dto/assign-ceo/assign-ceo-request.dto';
import { AssignCeoResponseDto } from './dto/assign-ceo/assign-ceo-response.dto';
import { GetCeoResponse } from './dto/get-ceo/get-ceo-response.dto';
import { Request, Response } from 'express';
import { StudentXpPair, UpdateStudentXpResponse } from './dto/student-xp/update-xp.dto';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { MomentOfGloryRequestDto } from './dto/perk-dto/moment-of-glory-perk.dto';
import { TrendsetterRequestDto } from './dto/perk-dto/trendsetter-perk.dto';
import { GetStudentsSkillsResponse } from './dto/get-students-skills/get-students-skills.dto';
import { DeleteClassResponse } from './dto/delete-class/delete-class.dto';
import { StudentAssignedCeoResponse } from './dto/get-ceo/student-assigned-ceo.dto';
import { GetStudentXpResponse } from './dto/student-xp/get-xp.dto';
import { GetStudentMarketShareResponse } from './dto/class-market-share/get-class-market-share.dto';
import {
  StudentMarketSharePair,
  UpdateStudentMarketShareResponse,
} from './dto/class-market-share/update-class-market-share.dto';
import { GetClassOverviewResponse } from './dto/get-class-overview/get-class-overview.dto';

@Controller('class')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@ApiCookieAuth('access_token')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Get('')
  @ApiGetClass()
  @Roles(Role.Teacher)
  async getClass(@Req() req: AuthenticatedRequest): Promise<GetClassResponseDto> {
    const dto: GetClassRequestDto = { instructorId: req.user.id };
    return this.classService.getClass(dto);
  }

  @Get(':cid/students')
  @ApiGetStudentsForClass()
  @Roles(Role.Teacher)
  async getStudentForClass(
    @Param('cid', new ParseUUIDPipe()) classId: string,
  ): Promise<GetStudentForClassResponseDto> {
    return this.classService.getStudentForClass({ classId });
  }

  @Post('create-class')
  @ApiCreateClass()
  @Roles(Role.Teacher)
  async createClass(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateClassRequestDto,
  ): Promise<CreateClassResponseDto> {
    const userId = req.user.id;
    return this.classService.createClass(dto, userId);
  }
  @Post('join-meeting')
  @Roles(Role.Student, Role.Teacher)
  @UseGuards(ZoomAuthGuard)
  @ApiGenerateSignature()
  async generateMeetingJwt(
    @Body() body: JoinMeetingRequestDto,
    @Req() req: Request | ZoomRequest,
  ): Promise<MeetingResponseDto> {
    return this.classService.generateMeetingJwt(body, req);
  }

  @Post('create-meeting')
  @Roles(Role.Teacher)
  @UseGuards(ZoomAuthGuard)
  @ApiCreateMeeting()
  async getMeetingLink(
    @Req() req: ZoomRequest,
    @Res({ passthrough: true }) res: Response,
    @Body() body: CreateMeetingRequestDto,
  ): Promise<ApiResponse> {
    return await this.classService.createMeeting(req, res, body.startTime);
  }

  @Patch(':cid/toggle-class-status')
  @Roles(Role.Teacher)
  @ApiToggleClassStatus()
  async toggleClassStatus(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<toggleClassResponse> {
    return this.classService.toggleClassStatus(classId, req.user.id);
  }

  @Get(':cid/ceo')
  @Roles(Role.Student, Role.Teacher)
  @ApiGetCeo()
  async getCeo(@Param('cid', new ParseUUIDPipe()) classId: string): Promise<GetCeoResponse> {
    return this.classService.getCeo(classId);
  }

  @Post(':cid/students/:sid/enroll')
  @Roles(Role.Teacher)
  async enrollStudent(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Param('sid', new ParseUUIDPipe()) studentId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.classService.enrollStudent(classId, studentId);
  }

  @Post(':cid/students/:sid/assign-ceo')
  @Roles(Role.Student, Role.Teacher)
  @ApiAssignCeo()
  async assignCeo(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Param('sid', new ParseUUIDPipe()) studentId: string,
    @Body() dto: AssignCeoDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<AssignCeoResponseDto> {
    if (req.user.role === Role.Student && req.user.id !== studentId) {
      throw new ForbiddenException({
        success: false,
        message: 'Students can only choose a CEO for themselves',
      });
    }
    return this.classService.assignCeo(classId, studentId, dto);
  }

  @Get(':cid/students/overview')
  @Roles(Role.Teacher)
  async getClassOverview(
    @Param('cid', new ParseUUIDPipe()) classId: string,
  ): Promise<GetClassOverviewResponse> {
    return this.classService.getClassOverview(classId);
  }

  @Get(':cid/students/skills')
  @Roles(Role.Teacher)
  @ApiGetStudentsSkills()
  async getStudentsSkills(
    @Param('cid', new ParseUUIDPipe()) classId: string,
  ): Promise<GetStudentsSkillsResponse> {
    return this.classService.getStudentsSkills(classId);
  }

  @Delete(':cid')
  @Roles(Role.Teacher)
  @ApiDeleteClass()
  async deleteClass(
    @Param('cid', new ParseUUIDPipe()) classId: string,
  ): Promise<DeleteClassResponse> {
    return this.classService.deleteClass(classId);
  }

  @Get(':cid/students/:sid/ceo')
  @Roles(Role.Student)
  @ApiStudentAssignedCeo()
  async getAssignedCeo(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Param('sid', new ParseUUIDPipe()) studentId: string,
  ): Promise<StudentAssignedCeoResponse> {
    return this.classService.getAssignedCeo(classId, studentId);
  }

  @Post(':cid/students/:sid/perks/:pid')
  @Roles(Role.Student)
  @ApiUsePerk()
  async usePerk(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Param('sid', new ParseUUIDPipe()) studentId: string,
    @Param('pid', new ParseUUIDPipe()) perkId: string,
    @Body() body?: Record<string, unknown>,
  ): Promise<ApiResponse> {
    return this.classService.usePerk(classId, studentId, perkId, body);
  }

  @Patch(':cid/students/:sid/perks/:pid/activate')
  @Roles(Role.Student)
  async activatePerk(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Param('sid', new ParseUUIDPipe()) studentId: string,
    @Param('pid', new ParseUUIDPipe()) perkId: string,
  ): Promise<ApiResponse> {
    return this.classService.activateStudentPerk(classId, studentId, perkId);
  }

  @Get(':cid/students/:sid/espionage-data')
  @Roles(Role.Student)
  async getEspionageData(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Param('sid', new ParseUUIDPipe()) studentId: string,
  ): Promise<ApiResponse> {
    return this.classService.getEspionageSkillTrees(classId, studentId);
  }

  @Patch(':cid/students/:sid/perks/:pid/reset')
  @Roles(Role.Teacher)
  async resetPerk(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Param('sid', new ParseUUIDPipe()) studentId: string,
    @Param('pid', new ParseUUIDPipe()) perkId: string,
  ): Promise<ApiResponse> {
    return this.classService.resetStudentPerk(classId, studentId, perkId);
  }

  @Patch(':cid/students/:sid/perks/:pid/unlock')
  @Roles(Role.Teacher)
  async unlockPerk(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Param('sid', new ParseUUIDPipe()) studentId: string,
    @Param('pid', new ParseUUIDPipe()) perkId: string,
  ): Promise<ApiResponse> {
    return this.classService.unlockStudentPerk(classId, studentId, perkId);
  }

  @Post(':cid/students/xp')
  @Roles(Role.Teacher)
  @ApiUpdateStudentsXp()
  async updateXp(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Body() body: Record<string, number>[],
  ): Promise<UpdateStudentXpResponse> {
    if (!Array.isArray(body)) {
      throw new BadRequestException('Request body must be an array');
    }
    const transformed = body.map((obj) => {
      const entries = Object.entries(obj);
      const studentId = entries[0][0];
      const xp = entries[0][1];
      const numericXp = Number(xp);
      if (numericXp > 50 || numericXp < 0) {
        throw new BadRequestException({
          success: false,
          message: `Value for Xp must be between 0 and 50`,
        });
      }
      return { studentId, xp: numericXp };
    });
    const dtos = plainToInstance(StudentXpPair, transformed);
    await Promise.all(dtos.map((dto) => validateOrReject(dto)));

    return this.classService.updateXp(classId, dtos);
  }

  @Get(':cid/students/xp')
  @Roles(Role.Student, Role.Teacher)
  @ApiGetStudentsXp()
  async getXp(@Param('cid', new ParseUUIDPipe()) classId: string): Promise<GetStudentXpResponse> {
    return this.classService.getXp(classId);
  }

  @Post(':cid/students/:sid/perks/moment-of-glory')
  @Roles(Role.Teacher)
  @ApiMomentOfGlory()
  async useMomentOfGlory(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Param('sid', new ParseUUIDPipe()) studentId: string,
    @Body() body: MomentOfGloryRequestDto,
  ): Promise<ApiResponse> {
    return this.classService.useMomentOfGlory(classId, studentId, body);
  }

  @Post(':cid/students/:sid/perks/trendsetter')
  @Roles(Role.Teacher)
  @ApiTrendsettter()
  async useTrendsetter(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Param('sid', new ParseUUIDPipe()) studentId: string,
    @Body() body: TrendsetterRequestDto,
  ): Promise<ApiResponse> {
    return this.classService.useTrendsetter(classId, studentId, body);
  }

  @Get(':cid/export')
  @Roles(Role.Teacher)
  @ApiExportClassData()
  async exportClassCsv(@Param('cid', new ParseUUIDPipe()) classId: string, @Res() res: Response) {
    const csvData = await this.classService.exportClassCsv(classId);
    res.header('Content-Type', 'text/csv');
    res.attachment(`class-${classId}-export.csv`);
    res.send(csvData.data);
  }

  @Post(':cid/continue')
  @Roles(Role.Teacher)
  async continueClass(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateClassRequestDto,
  ): Promise<CreateClassResponseDto> {
    return this.classService.continueClass(classId, dto, req.user.id);
  }

  @Get(':cid/students/market-share')
  @Roles(Role.Student, Role.Teacher)
  @ApiGetStudentsMarketShare()
  async getMarketShare(
    @Param('cid', new ParseUUIDPipe()) classId: string,
  ): Promise<GetStudentMarketShareResponse> {
    return this.classService.getMarketShare(classId);
  }

  @Post(':cid/students/market-share')
  @Roles(Role.Teacher)
  @ApiUpdateStudentsMarketShare()
  async updateMarketShare(
    @Param('cid', new ParseUUIDPipe()) classId: string,
    @Body() body: Record<string, unknown>[],
  ): Promise<UpdateStudentMarketShareResponse> {
    if (!Array.isArray(body)) {
      throw new BadRequestException('Request body must be an array');
    }
    const transformed = body.map((obj) => {
      const entries = Object.entries(obj);
      const studentId = entries[0][0];
      const marketShare = entries[0][1];
      const numericMarketShare = Number(marketShare);
      if (numericMarketShare > 100) {
        throw new BadRequestException({
          success: false,
          message: `Value for Market Share must be less than 100`,
        });
      }
      return { studentId, marketShare: numericMarketShare };
    });
    const dtos = plainToInstance(StudentMarketSharePair, transformed);
    await Promise.all(dtos.map((dto) => validateOrReject(dto)));

    return this.classService.updateMarketShare(classId, dtos);
  }
}
