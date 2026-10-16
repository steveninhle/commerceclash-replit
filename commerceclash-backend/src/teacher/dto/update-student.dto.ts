import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateStudentRequestDto {
  @ApiPropertyOptional({ description: 'Student name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Activate / deactivate the student', example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdatedStudentDto {
  @ApiProperty({ description: 'Student ID', example: 'uuid-string' })
  id!: string;

  @ApiProperty({ description: 'Student email', example: 'student@example.com' })
  email!: string;

  @ApiPropertyOptional({ description: 'Student name', example: 'John Doe or null' })
  name!: string | null;

  @ApiProperty({ description: 'Whether active', example: true })
  is_active!: boolean;

  @ApiProperty({ description: 'Created at timestamp' })
  created_at!: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updated_at!: Date;
}

export class UpdateStudentResponseDto {
  @ApiProperty({ description: 'Success flag', example: true })
  success!: boolean;

  @ApiProperty({ description: 'Message', example: 'Student updated successfully' })
  message!: string;

  @ApiPropertyOptional({ description: 'Updated student data', type: () => UpdatedStudentDto })
  data?: UpdatedStudentDto;

  @ApiPropertyOptional({ description: 'Error details if failed' })
  error?: any;
}
