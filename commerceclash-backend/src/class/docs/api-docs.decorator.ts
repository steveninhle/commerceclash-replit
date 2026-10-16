import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiProduces, ApiResponse } from '@nestjs/swagger';
import { JoinMeetingRequestDto } from '../dto/join-meeting.dto';
import { MeetingResponseDto } from '../dto/generate-meeting-jwt-response.dto';
import { ZoomCreateMeetingResponseDto } from '../dto/create-meeting/create-meeting-response.dto';
import { CreateClassRequestDto } from '../dto/create-class/create-class.dto';
import { CreateClassResponseDto } from '../dto/create-class/create-class-response.dto';
import { GetClassResponseDto } from '../dto/get-class/get-class-response.dto';
import { GetStudentForClassResponseDto } from '../dto/get-student-for-class/get-student-for-class-response.dto';
import { toggleClassData } from '../dto/toggle-class-status-response.dto';
import { AssignCeoResponseDto } from '../dto/assign-ceo/assign-ceo-response.dto';
import { GetCeoResponse } from '../dto/get-ceo/get-ceo-response.dto';
import { GetStudentSkillsResponseDto } from 'src/student/dto/get-student-skills/get-student-skills-response.dto';
import { StudentAssignedCeoData } from '../dto/get-ceo/student-assigned-ceo.dto';
import { UpdateStudentXpResponse } from '../dto/student-xp/update-xp.dto';
import { GetStudentXpResponse } from '../dto/student-xp/get-xp.dto';
import { GetStudentMarketShareResponse } from '../dto/class-market-share/get-class-market-share.dto';
import { UpdateStudentMarketShareResponse } from '../dto/class-market-share/update-class-market-share.dto';
export function ApiGetClass() {
  return applyDecorators(
    ApiOperation({ summary: 'Get existing user created Classes (teacher scope)' }),
    ApiResponse({
      status: 200,
      description: 'Classes found successfully',
      type: GetClassResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation error',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
    }),
  );
}
export function ApiCreateClass() {
  return applyDecorators(
    ApiOperation({ summary: 'Creates a new Class (teacher scope)' }),
    ApiBody({ type: CreateClassRequestDto }),
    ApiResponse({
      status: 201,
      description: 'Meeting Signature Generated Successfully',
      type: CreateClassResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation error',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
    }),
  );
}

export function ApiGenerateSignature() {
  return applyDecorators(
    ApiOperation({ summary: 'Generate a Zoom Meeting Signature (teacher, Student scope)' }),
    ApiBody({ type: JoinMeetingRequestDto }),
    ApiResponse({
      status: 201,
      description: 'Meeting Signature Generated Successfully',
      type: MeetingResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation error',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
    }),
  );
}
export function ApiCreateMeeting() {
  return applyDecorators(
    ApiOperation({ summary: 'Creates a Zoom Meeting (teacher scope)' }),
    ApiResponse({
      status: 201,
      description: 'Meeting created successfully',
      type: ZoomCreateMeetingResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - validation error',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden Resources - validation error',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
    }),
  );
}

export function ApiGetStudentsForClass() {
  return applyDecorators(
    ApiOperation({ summary: 'Get students enrolled in a class (teacher scope)' }),
    ApiParam({
      name: 'cid',
      description: 'UUID of the class',
      example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    }),
    ApiResponse({
      status: 200,
      description: 'Students found successfully / or empty list',
      type: GetStudentForClassResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Class not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function ApiToggleClassStatus() {
  return applyDecorators(
    ApiOperation({ summary: 'Update Class Status (Teacher Scope only)' }),
    ApiParam({
      name: 'cid',
      description: 'UUID of the class',
      example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    }),
    ApiResponse({
      status: 200,
      description: 'Class status updated successfully',
      type: toggleClassData,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Class not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function ApiGetCeo() {
  return applyDecorators(
    ApiOperation({ summary: 'Get Class Ceo (Teacher Scope only)' }),
    ApiParam({
      name: 'cid',
      description: 'UUID of the class',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiResponse({
      status: 200,
      description: 'CEO fetched successfully',
      type: GetCeoResponse,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Class not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}
export function ApiAssignCeo() {
  return applyDecorators(
    ApiOperation({ summary: 'Assign Ceo to Student(Teacher Scope only)' }),
    ApiParam({
      name: 'cid',
      description: 'UUID of the class',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiParam({
      name: 'sid',
      description: 'UUID of the student',
      example: 'c3f62780-bd5e-4581-b35b-820ad33af863',
    }),
    ApiResponse({
      status: 200,
      description: 'Perks assigned successfully',
      type: AssignCeoResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Class or Student not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function ApiGetStudentsSkills() {
  return applyDecorators(
    ApiOperation({ summary: 'Get Students Skills (Teacher Scope Only)' }),
    ApiParam({
      name: 'cid',
      description: 'UUID of the class',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiResponse({
      status: 200,
      description: 'Students skills fetched successfully',
      type: GetStudentSkillsResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Class not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function ApiDeleteClass() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete Class (Teacher Scope Only)' }),
    ApiParam({
      name: 'cid',
      description: 'UUID of the class',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiResponse({
      status: 200,
      description: 'Class deleted successfully',
      type: GetStudentSkillsResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Class not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}
export function ApiStudentAssignedCeo() {
  return applyDecorators(
    ApiOperation({ summary: 'Get Students Assigned Ceo (Teacher Scope Only)' }),
    ApiParam({
      name: 'cid',
      description: 'UUID of the class',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiParam({
      name: 'sid',
      description: 'UUID of the student',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiResponse({
      status: 200,
      description: 'Ceo Fetched successfully',
      type: StudentAssignedCeoData,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Class not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}
export function ApiUsePerk() {
  return applyDecorators(
    ApiOperation({ summary: 'Use Perk (Student Scope Only)' }),
    ApiParam({
      name: 'cid',
      description: 'UUID of the class',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiParam({
      name: 'sid',
      description: 'UUID of the student',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiParam({
      name: 'pid',
      description: 'UUID of the perk',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiResponse({
      status: 200,
      description: 'Ceo Fetched successfully',
      type: ApiResponse,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Class not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}
export function ApiUpdateStudentsXp() {
  return applyDecorators(
    ApiOperation({ summary: 'Update Students XP (Teacher Scope Only)' }),
    ApiParam({
      name: 'cid',
      description: 'UUID of the class',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiResponse({
      status: 200,
      description: 'Students Xp Updated successfully',
      type: UpdateStudentXpResponse,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Class not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}
export function ApiGetStudentsXp() {
  return applyDecorators(
    ApiOperation({ summary: 'Get Students XP (Teacher Scope Only)' }),
    ApiParam({
      name: 'cid',
      description: 'UUID of the class',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiResponse({
      status: 200,
      description: 'Students Xp Fetched successfully',
      type: GetStudentXpResponse,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Class not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}
export function ApiMomentOfGlory() {
  return applyDecorators(
    ApiOperation({ summary: 'Moment of Glory Perk (Teacher Scope Only)' }),
    ApiParam({
      name: 'cid',
      description: 'UUID of the class',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiParam({
      name: 'sid',
      description: 'UUID of the student',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiResponse({
      status: 200,
      description: 'Market Share updated successfully',
      type: ApiResponse,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden Resources' }),
    ApiResponse({ status: 404, description: 'Enrollment not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}
export function ApiTrendsettter() {
  return applyDecorators(
    ApiOperation({ summary: 'Trendsetter Perk (Teacher Scope Only)' }),
    ApiParam({
      name: 'cid',
      description: 'UUID of the class',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiParam({
      name: 'sid',
      description: 'UUID of the student',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiResponse({
      status: 200,
      description: 'Market Share Updated successfully',
      type: ApiResponse,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden Resources' }),
    ApiResponse({ status: 404, description: 'Enrollment not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function ApiExportClassData() {
  return applyDecorators(
    ApiOperation({ summary: 'Export Class Data (Teacher Scope Only)' }),
    ApiParam({
      name: 'cid',
      description: 'UUID of the class',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiProduces('text/csv'),

    ApiResponse({
      status: 200,
      description: 'Successfully exported class data as CSV file',
      content: {
        'text/csv': {
          schema: {
            type: 'string',
            example:
              'Name,Company,Archetype,Level,XP,Perks Unlocked,Perks Used,Skill Allocations,Market Share\nAlice,alice@company.com,Warrior,3,120,Fireball,Shield,"Strength: 10; Agility: 5",40',
          },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden Resources' }),
    ApiResponse({ status: 404, description: 'Class not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function ApiGetStudentsMarketShare() {
  return applyDecorators(
    ApiOperation({ summary: 'Get Students Market Share (Teacher Scope Only)' }),
    ApiParam({
      name: 'cid',
      description: 'UUID of the class',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiResponse({
      status: 200,
      description: 'Students Market Share Fetched successfully',
      type: GetStudentMarketShareResponse,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Class not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function ApiUpdateStudentsMarketShare() {
  return applyDecorators(
    ApiOperation({ summary: 'Update Students Market Share (Teacher Scope Only)' }),
    ApiParam({
      name: 'cid',
      description: 'UUID of the class',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiResponse({
      status: 200,
      description: 'Students Xp Updated successfully',
      type: UpdateStudentMarketShareResponse,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 404, description: 'Class not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}
