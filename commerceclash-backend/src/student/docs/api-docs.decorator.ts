import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GetStudentResponseDto } from '../dto/get-student-response.dto';
import { GetOwnClassesResponseDto } from '../dto/get-own-classes.dto';
import { UnenrollResponseDto } from '../dto/unenroll-class.dto';
import { ResetSkillsResponseDto } from '../dto/reset-skills/reset-skills-response.dto';
import { UpsertSkillResponseDto } from '../dto/upsert-skill/upsert-skill-response.dto';
import { GetStudentSkillsResponseDto } from '../dto/get-student-skills/get-student-skills-response.dto';
import { PointsShiftingResponse } from '../dto/point-shifting.dto';

export function ApiGetProfile() {
  return applyDecorators(
    ApiOperation({ summary: 'Get current authenticated student profile (student scope)' }),
    ApiParam({
      name: 'sid',
      description: 'Student UUID (must match authenticated user)',
      example: 'c3f62780-bd5e-4581-b35b-820ad33af863',
    }),
    ApiResponse({
      status: 200,
      description: 'Student profile fetched successfully',
      type: GetStudentResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - missing / invalid auth' }),
    ApiResponse({ status: 403, description: 'Forbidden - requires Student role' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function ApiGetOwnClasses() {
  return applyDecorators(
    ApiOperation({ summary: 'Get classes current student is enrolled in (student scope)' }),
    ApiParam({
      name: 'sid',
      description: 'Student UUID (must match authenticated user)',
      example: 'c3f62780-bd5e-4581-b35b-820ad33af863',
    }),
    ApiResponse({
      status: 200,
      description: 'Enrolled classes fetched successfully (or empty list)',
      type: GetOwnClassesResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - missing / invalid auth' }),
    ApiResponse({ status: 403, description: 'Forbidden - requires Student role' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}
export function ApiUnenroll() {
  return applyDecorators(
    ApiOperation({ summary: 'Unenroll from a Class (Student scope)' }),
    ApiParam({
      name: 'cid',
      description: 'Class UUID',
      example: '15fcd64d-2c80-4e5a-9cd5-c84980ea0cba',
    }),
    ApiParam({
      name: 'sid',
      description: 'Student UUID (must match authenticated user)',
      example: 'c3f62780-bd5e-4581-b35b-820ad33af863',
    }),
    ApiResponse({
      status: 200,
      description: 'Enrolled classes fetched successfully (or empty list)',
      type: UnenrollResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - missing / invalid auth' }),
    ApiResponse({ status: 403, description: 'Forbidden - requires Student role' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}
export function ApiGetStudentSkills() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get skills for the requesting student enrollment in a class (student scope)',
    }),
    ApiParam({
      name: 'cid',
      description: 'Class UUID',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiParam({
      name: 'sid',
      description: 'Student UUID (must match authenticated user)',
      example: 'c3f62780-bd5e-4581-b35b-820ad33af863',
    }),
    ApiResponse({
      status: 200,
      description: 'Student skills returned',
      type: GetStudentSkillsResponseDto,
    }),
    ApiResponse({ status: 403, description: 'Forbidden - cannot view other student skills' }),
    ApiResponse({ status: 404, description: 'Class or enrollment not found' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
}

export function ApiUpdateSkill() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Update a student skill value (increase or decrease — value must differ from current)',
    }),
    ApiParam({
      name: 'cid',
      description: 'Class UUID',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiParam({
      name: 'sid',
      description: 'Student UUID (must match authenticated user)',
      example: 'c3f62780-bd5e-4581-b35b-820ad33af863',
    }),
    ApiParam({
      name: 'skillId',
      description: 'Student skill record UUID',
      example: '6e908b3e-87ef-4f4f-a0c8-e2d61a472d02',
    }),
    ApiResponse({
      status: 200,
      description: 'Skill updated successfully',
      type: UpsertSkillResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - value equals current, or not enough available points',
    }),
    ApiResponse({ status: 404, description: 'Skill or enrollment not found' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
}
export function ApiResetSkills() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reset all student skills for a class enrollment to 0 (student scope)',
    }),
    ApiParam({
      name: 'cid',
      description: 'Class UUID',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiParam({
      name: 'sid',
      description: 'Student UUID (must match authenticated user)',
      example: 'c3f62780-bd5e-4581-b35b-820ad33af863',
    }),
    ApiResponse({
      status: 201,
      description: 'Skill reset successful',
      type: ResetSkillsResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Enrollment or class not found' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
}
export function ApiSkillsStatus() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get Skill status (student scope)',
    }),
    ApiParam({
      name: 'sid',
      description: 'Student UUID (must match authenticated user)',
      example: 'c3f62780-bd5e-4581-b35b-820ad33af863',
    }),
    ApiParam({
      name: 'cid',
      description: 'Class UUID',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiResponse({
      status: 201,
      description: 'Skill Status Fetched successful',
    }),
    ApiResponse({ status: 404, description: 'Enrollment or class not found' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
}
export function ApiSkillShifting() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get Skill status (student scope)',
    }),
    ApiParam({
      name: 'sid',
      description: 'Student UUID (must match authenticated user)',
      example: 'c3f62780-bd5e-4581-b35b-820ad33af863',
    }),
    ApiParam({
      name: 'cid',
      description: 'Class UUID',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiResponse({
      status: 201,
      description: 'Skill Shifted successful',
      type: PointsShiftingResponse,
    }),
    ApiResponse({ status: 404, description: 'Enrollment or class not found' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
}

export function ApiDeleteStudent() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete Student (Teacher scope)',
    }),
    ApiParam({
      name: 'sid',
      description: 'Student UUID (must match authenticated user)',
      example: 'c3f62780-bd5e-4581-b35b-820ad33af863',
    }),
    ApiResponse({
      status: 201,
      description: 'Student Deleted successfully',
    }),
    ApiResponse({ status: 404, description: 'Student not found' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
}
