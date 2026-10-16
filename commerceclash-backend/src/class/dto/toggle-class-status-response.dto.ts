import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';

export class toggleClassData {
  @ApiProperty({
    description: 'Class Status updated',
    example: true,
  })
  is_active!: boolean;
}

export class toggleClassResponse implements ApiResponse {
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
    description: 'Response payload containing status of class.',
    type: toggleClassData,
  })
  data?: toggleClassData;

  @ApiPropertyOptional({
    description: 'Error details if the request failed.',
    example: 'Failed to update class status',
  })
  error?: any;
}
