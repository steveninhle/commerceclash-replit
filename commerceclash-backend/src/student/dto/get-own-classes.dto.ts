import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OwnClassDto {
  @ApiProperty({ description: 'Class ID', example: 'uuid-class-1' })
  id!: string;

  @ApiPropertyOptional({ description: 'Cohort ID associated with the class', nullable: true })
  cohort_id?: string | null;

  @ApiPropertyOptional({
    description: 'Meeting ID associated with the class',
    example: '123456789',
    nullable: true,
  })
  meeting_id!: string | null;

  @ApiProperty({ description: 'Class name', example: 'Physics 101' })
  name!: string;

  @ApiPropertyOptional({
    description: 'Meeting link (Zoom / external)',
    example: 'https://zoom.us/j/123456789',
    nullable: true,
  })
  meeting_link!: string | null;

  @ApiPropertyOptional({ description: 'Class passcode if any', example: 'a1b2c3', nullable: true })
  passcode?: string | null;

  @ApiPropertyOptional({ description: 'Duration (minutes)', example: 60, nullable: true })
  duration?: number | null;

  @ApiProperty({ description: 'Instructor (teacher) user ID', example: 'uuid-user-1' })
  instructor_id!: string;

  @ApiPropertyOptional({ description: 'Allocated points of class ', example: 10, nullable: true })
  allocate_points!: number | null;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at!: Date;

  @ApiPropertyOptional({ description: 'Scheduled start time of class', nullable: true })
  start_time?: Date | null;

  @ApiPropertyOptional({ description: 'Scheduled end time of class', nullable: true })
  end_time?: Date | null;

  @ApiProperty({ description: 'Status of class', example: true })
  status!: boolean;
}

export class GetOwnClassesResponseDto {
  @ApiProperty({ description: 'Whether the request succeeded', example: true })
  success!: boolean;

  @ApiProperty({ description: 'Human readable message' })
  message!: string;

  @ApiProperty({ description: 'Nearest enrolled class', type: () => OwnClassDto, nullable: true })
  data!: OwnClassDto | null;

  @ApiPropertyOptional({ description: 'Error details when failed', nullable: true })
  error?: any;
}
