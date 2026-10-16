import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SingleStudentCourseDto {
  @ApiProperty({ description: 'Class ID', example: 'f1c4b8d2-1e0b-4c5d-9a7f-123456789abc' })
  id!: string;

  @ApiProperty({ description: 'Class name', example: 'Physics 201' })
  name!: string;
}

export class SingleStudentDto {
  @ApiProperty({ description: 'Student ID', example: 'uuid-student' })
  id!: string;

  @ApiProperty({ description: 'Student email', example: 'student@example.com' })
  email!: string;

  @ApiProperty({ description: 'Full name', nullable: true, example: 'Jane Smith' })
  name!: string | null;

  @ApiProperty({ description: 'Whether the student is active', example: true })
  is_active!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at!: Date;

  @ApiProperty({ description: 'Enrolled classes', type: () => [SingleStudentCourseDto] })
  enrolled_courses!: SingleStudentCourseDto[];
}

export class GetStudentResponseDto {
  @ApiProperty({ description: 'Success flag', example: true })
  success!: boolean;

  @ApiProperty({ description: 'Message', example: 'Student found successfully' })
  message!: string;

  @ApiPropertyOptional({
    description: 'Student data when successful',
    type: () => SingleStudentDto,
  })
  data?: SingleStudentDto;

  @ApiPropertyOptional({ description: 'Error details if failed', example: 'Student not found' })
  error?: any;
}
