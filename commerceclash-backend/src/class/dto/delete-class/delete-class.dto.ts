import { ApiProperty } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';

export class DeleteClassResponse implements ApiResponse {
  @ApiProperty({
    description: 'Indicates whether the request was successful',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Descriptive message about the operation result',
    example: 'Class deleted successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Returned data payload (if any)',
    example: null,
    nullable: true,
  })
  data?: any;

  @ApiProperty({
    description: 'Error details (if the operation failed)',
    example: null,
    nullable: true,
  })
  error?: any;
}
