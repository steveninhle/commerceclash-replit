import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateStudentStatusRequestDto {
  @ApiPropertyOptional({ description: 'Activate / deactivate the student', example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdatedStudentDto {
  @ApiProperty({ description: 'Whether active', example: true })
  is_active!: boolean;
}

export class UpdateStudentStatusResponseDto {
  @ApiProperty({ description: 'Success flag', example: true })
  success!: boolean;
  @ApiProperty({ description: 'Message', example: 'Student updated successfully' })
  message!: string;
  @ApiPropertyOptional({ description: 'Updated student data', type: () => UpdatedStudentDto })
  data?: UpdatedStudentDto;
  @ApiPropertyOptional({ description: 'Error details if failed' })
  error?: any;
}
