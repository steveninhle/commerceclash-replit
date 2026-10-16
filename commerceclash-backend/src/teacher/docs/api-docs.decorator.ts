import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { GetStudentResponseDto } from '../../student/dto/get-student-response.dto';
import { UpdateStudentRequestDto, UpdateStudentResponseDto } from '../dto/update-student.dto';
import { GetStudentsForTeacherResponseDto } from '../dto/get-all-student.dto';
import { UpdateStudentStatusResponseDto } from '../dto/update-student-status.dto';
import { DeleteSkillResponseDto } from '../dto/delete-skill/delete-skill-response.dto';
import { EditSkillResponseDto } from '../dto/edit-skill/edit-skill-response.dto';
import { GetSkillsResponseDto } from '../dto/get-skills/get-skills-response.dto';
import { AddSkillResponseDto } from '../dto/add-skill/add-skill-response.dto';
import { CreateStudentDto } from '../dto/create-student.dto';

export function ApiAddStudentByTeacher() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new student account (teacher scope)' }),
    ApiParam({ name: 'tid', description: 'UUID of the teacher' }),
    ApiBody({ type: CreateStudentDto }),
    ApiResponse({ status: 201, description: 'Student created successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiResponse({ status: 409, description: 'Email already in use' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function ApiGetAllStudents() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all students (teacher scope)' }),
    ApiResponse({
      status: 200,
      description: 'Students found successfully (or empty list if none)',
      type: GetStudentsForTeacherResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - missing / invalid auth' }),
    ApiResponse({ status: 403, description: 'Forbidden - insufficient role (needs Teacher)' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function ApiGetStudent() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a single student by ID (teacher scope)' }),
    ApiParam({
      name: 'tid',
      description: 'UUID of the teacher',
      example: 'c0e9b0b3-660e-4cc5-afbb-f34335b4d5ae',
    }),
    ApiParam({
      name: 'sid',
      description: 'UUID of the student',
      example: 'c3f62780-bd5e-4581-b35b-820ad33af863',
    }),
    ApiResponse({
      status: 200,
      description: 'Student found successfully',
      type: GetStudentResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized - missing / invalid auth' }),
    ApiResponse({ status: 403, description: 'Forbidden - insufficient role (needs Teacher)' }),
    ApiResponse({ status: 404, description: 'Student not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function ApiUpdateStudent() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a student (name, active state)' }),

    ApiParam({
      name: 'tid',
      description: 'UUID of the teacher',
      example: 'c0e9b0b3-660e-4cc5-afbb-f34335b4d5ae',
    }),
    ApiParam({
      name: 'sid',
      description: 'UUID of the student',
      example: 'c3f62780-bd5e-4581-b35b-820ad33af863',
    }),
    ApiBody({ type: UpdateStudentRequestDto }),
    ApiResponse({
      status: 200,
      description: 'Student updated successfully',
      type: UpdateStudentResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Validation error (invalid UUID or body)' }),
    ApiResponse({ status: 401, description: 'Unauthorized - missing / invalid auth' }),
    ApiResponse({ status: 403, description: 'Forbidden - insufficient role (needs Teacher)' }),
    ApiResponse({ status: 404, description: 'Student not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}
export function ApiUpdateStudentStatus() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a student (name, active state)' }),
    ApiParam({
      name: 'tid',
      description: 'UUID of the teacher',
      example: 'c0e9b0b3-660e-4cc5-afbb-f34335b4d5ae',
    }),
    ApiParam({
      name: 'sid',
      description: 'UUID of the student',
      example: 'c3f62780-bd5e-4581-b35b-820ad33af863',
    }),
    ApiBody({ type: UpdateStudentStatusResponseDto }),
    ApiResponse({
      status: 200,
      description: 'Student updated successfully',
      type: UpdateStudentStatusResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Validation error (invalid UUID or body)' }),
    ApiResponse({ status: 401, description: 'Unauthorized - missing / invalid auth' }),
    ApiResponse({ status: 403, description: 'Forbidden - insufficient role (needs Teacher)' }),
    ApiResponse({ status: 404, description: 'Student not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function ApiAddSkill() {
  return applyDecorators(
    ApiOperation({ summary: 'Add a skill for a student in a class' }),
    ApiParam({
      name: 'cid',
      description: 'UUID of the class',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiResponse({
      status: 201,
      description: 'Skill successfully added',
      type: AddSkillResponseDto,
    }),
    ApiResponse({
      status: 404,
      description: 'Student not enrolled in class',
    }),
  );
}

export function ApiGetSkills() {
  return applyDecorators(
    ApiOperation({
      summary: 'List all skills/attributes defined for a class (teacher scope)',
    }),
    ApiParam({
      name: 'cid',
      description: 'Class UUID',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiResponse({
      status: 200,
      description: 'Skills fetched successfully',
      type: GetSkillsResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Class not found / no enrolled students' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
}

export function ApiUpdateSkill() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update an existing skill (propagates name/value to all enrolled students)',
    }),
    ApiParam({
      name: 'cid',
      description: 'Class UUID',
      example: '6bac7505-ca8a-479b-8f41-b5bad6263ce5',
    }),
    ApiParam({
      name: 'skillId',
      description: 'Skill/Attribute UUID to update',
      example: 'e965dae5-7822-4fb3-b136-6963b193d702',
    }),
    ApiResponse({
      status: 201,
      description: 'Skills updated successfully (or partial failures)',
      type: EditSkillResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Skill or class not found' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
}

export function ApiDeleteSkill() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a skill definition from a class (teacher scope)' }),
    ApiParam({ name: 'cid', description: 'Class UUID' }),
    ApiParam({ name: 'skillId', description: 'Skill/Attribute UUID' }),
    ApiResponse({
      status: 201,
      description: 'Skill deleted successfully',
      type: DeleteSkillResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Skill or class not found' }),
    ApiResponse({ status: 500, description: 'Internal server error' }),
  );
}
