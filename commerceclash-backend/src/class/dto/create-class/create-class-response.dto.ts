import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';

export class CreateClassDataDto {
  id!: string;
  created_at!: Date;
  meeting_id!: string;
  name!: string;
  meeting_link!: string;
  passcode?: string;
  duration?: number;
  allocate_points?: number | null;
  instructor_id!: string;
  enrolled_student?: string[];
  start_time?: Date | null;
  end_time?: Date | null;
}

export class CreateClassResponseDto implements ApiResponse {
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
    type: CreateClassDataDto,
  })
  data?: CreateClassDataDto;

  @ApiPropertyOptional({
    description: 'Error details if the request failed.',
    example: 'Failed to create class',
  })
  error?: string;
}
