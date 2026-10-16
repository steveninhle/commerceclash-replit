import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnrolledCourseNameDto {
  @ApiProperty({
    description: 'Id of the enrolled class',
    example: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Name of the enrolled class',
    example: 'Math 101',
  })
  name!: string;
}

export class TeacherStudentDto {
  @ApiProperty({ description: 'Student ID', example: 'uuid-student-1' })
  id!: string;

  @ApiProperty({ description: 'Full name of the student (nullable)', nullable: true })
  name!: string | null;

  @ApiProperty({ description: 'Email of the student', example: 'student@example.com' })
  email!: string;

  @ApiProperty({ description: 'Whether the student is active', example: true })
  is_active!: boolean;

  @ApiProperty({ description: 'Creation date of the student record' })
  created_at!: Date;

  @ApiProperty({
    description: 'List of enrolled course names',
    type: () => [EnrolledCourseNameDto],
  })
  enrolled_courses!: EnrolledCourseNameDto[];
}

export class GetStudentsForTeacherResponseDto {
  @ApiProperty({ description: 'Indicates whether the request was successful', example: true })
  success!: boolean;

  @ApiProperty({ description: 'Human-readable message', example: 'Students found successfully' })
  message!: string;

  @ApiProperty({
    description: 'List of students',
    type: () => [TeacherStudentDto],
  })
  data?: TeacherStudentDto[];

  @ApiPropertyOptional({
    description: 'Error details if the request failed',
    example: 'Something went wrong',
  })
  error?: any;
}
