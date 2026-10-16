import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty } from 'class-validator';

export class CreateMeetingRequestDto {
  @ApiProperty({
    description: 'ISO 8601 UTC start time for the Zoom scheduled meeting.',
    example: '2025-05-01T04:00:00.000Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  startTime!: string;
}
