import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';

export class UnenrollResponseDto implements ApiResponse {
  @ApiProperty({
    description: 'Indicates whether the operation was successful.',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'A human-readable message describing the result.',
    example: 'Class Unenrolled successfully.',
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'Error message in case of failure.',
    example: 'Invalid API credentials.',
  })
  error?: string;
}
