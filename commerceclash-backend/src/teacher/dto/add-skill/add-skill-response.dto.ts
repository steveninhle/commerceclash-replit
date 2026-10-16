import { ApiProperty } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';

export class AddSkillDataDto {
  @ApiProperty()
  id?: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  value?: number;

  @ApiProperty()
  studentId?: string;

  @ApiProperty()
  classId?: string;

  @ApiProperty()
  createdAt?: Date;
}

export class AddSkillResponseDto implements ApiResponse {
  @ApiProperty({
    description: 'Indicates whether the operation was successful.',
    example: true,
  })
  success!: boolean;
  @ApiProperty({
    description: 'A human-readable message describing the result.',
    example: 'Skills Added successfully.',
  })
  message!: string;
  @ApiProperty({
    description: 'The meeting details returned from Database.',
    type: AddSkillDataDto,
  })
  data?: AddSkillDataDto[];
  @ApiProperty({
    description: 'Error message in case of failure.',
    example: 'Invalid API credentials.',
  })
  errors?: any;
}
