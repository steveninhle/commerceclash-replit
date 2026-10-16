import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMeetingDto {
  @ApiProperty({
    description: 'The meetingId participants can use to join the Zoom meeting.',
    example: '2349344636',
  })
  @IsString()
  @IsNotEmpty()
  meeting_id!: string;
  @ApiProperty({
    description: 'The password participants can use to join the Zoom meeting.',
    example: 'bt5j9x',
  })
  @IsString()
  @IsNotEmpty()
  passcode!: string;

  @ApiProperty({
    description: 'The URL participants can use to join the Zoom meeting.',
    example: 'https://zoom.us/j/123456789?pwd=abcd1234',
  })
  @IsString()
  @IsNotEmpty()
  join_url!: string;

  @ApiPropertyOptional({
    description: 'The URL the host can use to start the Zoom meeting.',
    example: 'https://zoom.us/s/123456789?zak=eyJhbGciOiJI...',
  })
  @IsString()
  @IsNotEmpty()
  start_url?: string;
}

export class ZoomCreateMeetingResponseDto implements ApiResponse {
  @ApiProperty({
    description: 'Indicates whether the operation was successful.',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'A human-readable message describing the result.',
    example: 'Meeting created successfully.',
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'The meeting details returned from Zoom.',
    type: CreateMeetingDto,
  })
  data?: CreateMeetingDto;

  @ApiPropertyOptional({
    description: 'Error message in case of failure.',
    example: 'Invalid API credentials.',
  })
  error?: string;
}
