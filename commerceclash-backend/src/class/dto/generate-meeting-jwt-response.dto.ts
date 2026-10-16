import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MeetingDataDto {
  @ApiProperty({
    description: 'The Zoom Meeting SDK signature required to join/start a meeting.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  signature!: string;

  @ApiPropertyOptional({
    description: 'The Zoom SDK Key used to authenticate requests.',
    example: 'your-zoom-sdk-key',
  })
  @IsString()
  @IsNotEmpty()
  sdkKey?: string;

  @ApiPropertyOptional({
    description: 'The ZAK (Zoom Access Key) token, only returned for teachers (role = 1).',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsOptional()
  zak?: string;
}

export class MeetingResponseDto implements ApiResponse {
  @ApiProperty({
    description: 'Indicates whether the request was successful.',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'A human-readable message describing the result.',
    example: 'Signature generated successfully.',
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'Response payload containing Zoom signature and optional SDK key.',
    type: MeetingDataDto,
  })
  data?: MeetingDataDto;

  @ApiPropertyOptional({
    description: 'Error details if the request failed.',
    example: 'Invalid SDK credentials.',
  })
  error?: string;
}
