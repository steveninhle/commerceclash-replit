import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsUUID,
  IsInt,
  IsDateString,
} from 'class-validator';

export class CreateClassRequestDto {
  @ApiProperty({
    description: 'Unique identifier for the meeting',
    example: 'meeting-123',
  })
  @IsString()
  @IsNotEmpty()
  meetingId!: string;

  @ApiProperty({
    description: 'Name of the meeting',
    example: 'Team Sync-up',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Meeting URL link',
    example: 'https://zoom.us/j/123456789',
  })
  @IsString()
  @IsNotEmpty()
  meetingLink!: string;

  @ApiProperty({
    description: 'Points Allocation for Students to use for skills',
    example: 10,
    type: 'number',
  })
  @IsInt()
  @IsOptional()
  allocatePoints?: number | null;

  @ApiPropertyOptional({
    description: 'Passcode for the meeting, if any',
    example: 'abc123',
  })
  @IsOptional()
  @IsString()
  passcode?: string;

  @ApiPropertyOptional({
    description: 'Duration of the meeting in minutes',
    example: 60,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiPropertyOptional({
    description: 'Start time of the class (ISO string)',
    example: '2026-04-17T08:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time of the class (ISO string)',
    example: '2026-04-17T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Cohort ID to associate this class with',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  cohortId?: string;

  @ApiProperty({
    description: "Students Id's to invite or add to attend class",
    example: ['550e8400-e29b-41d4-a716-446655440000', '340e94500-e29b-41d4-a716-446655440000'],
    format: 'array',
  })
  @IsArray()
  @IsOptional()
  @IsUUID('all', { each: true })
  enrolledStudents?: string[];
}
