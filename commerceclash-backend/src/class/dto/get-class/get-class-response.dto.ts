import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';

export class ClassDataDto {
  @ApiProperty({
    description: 'Unique identifier of the class.',
    example: '3c8849d0-8e0d-41b4-a5d3-844d93b4e2ab',
  })
  id!: string;

  @ApiProperty({
    description: 'Timestamp when the class was created.',
    example: '2025-09-25T10:15:30.000Z',
  })
  created_at!: Date;

  @ApiProperty({
    description: 'External meeting ID associated with the class.',
    example: 'mtg_123456',
  })
  meeting_id!: string;

  @ApiProperty({
    description: 'The name of the class.',
    example: 'Introduction to Databases',
  })
  name!: string;

  @ApiProperty({
    description: 'Meeting link (e.g., Zoom/Google Meet) for the class.',
    example: 'https://zoom.us/j/1234567890',
  })
  meeting_link!: string;

  @ApiPropertyOptional({
    description: 'Passcode required to join the class, if any.',
    example: 'abc123',
    nullable: true,
  })
  passcode?: string | null;

  @ApiPropertyOptional({
    description: 'Duration of the class in minutes.',
    example: 90,
    type: Number,
    nullable: true,
  })
  duration?: number | null;

  @ApiProperty({
    description: 'UUID of the instructor (links to the `users` table).',
    example: '7b1c9a3f-2f6b-4c65-91d4-28d6c4146e56',
  })
  instructor_id!: string;

  @ApiProperty({
    description: 'Whether skill unlocking is locked for the class.',
    example: false,
  })
  skill_locked!: boolean;

  @ApiPropertyOptional({
    description: 'Start time of the class.',
    example: '2026-04-17T08:00:00.000Z',
    nullable: true,
  })
  start_time?: Date | null;

  @ApiPropertyOptional({
    description: 'End time of the class.',
    example: '2026-04-17T10:00:00.000Z',
    nullable: true,
  })
  end_time?: Date | null;
}

export class ClassifiedClassesDto {
  @ApiProperty({ description: 'Classes currently in progress', type: () => [ClassDataDto] })
  active!: ClassDataDto[];

  @ApiProperty({ description: 'Classes scheduled in the future', type: () => [ClassDataDto] })
  scheduled!: ClassDataDto[];

  @ApiProperty({ description: 'Classes that have ended', type: () => [ClassDataDto] })
  completed!: ClassDataDto[];
}

export class GetClassResponseDto implements ApiResponse {
  @ApiProperty({
    description: 'Indicates whether the request was successful.',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'A human-readable message describing the result.',
    example: 'Classes found successfully',
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'Classes grouped by status: active, scheduled, completed',
    type: () => ClassifiedClassesDto,
  })
  data?: ClassifiedClassesDto;

  @ApiPropertyOptional({
    description: 'Error details if the request failed.',
    example: 'Invalid Class Id ',
  })
  error?: any;
}
