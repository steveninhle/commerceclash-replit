import { ApiProperty } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';

export class EditSkillDataDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  value!: number;

  @ApiProperty()
  studentId?: string;

  @ApiProperty()
  classId!: string;

  @ApiProperty()
  updatedAt!: Date;
}

export class EditSkillResponseDto implements ApiResponse {
  @ApiProperty({
    description: 'Indicates whether the operation was successful.',
    example: true,
  })
  success!: boolean;
  @ApiProperty({
    description: 'A human-readable message describing the result.',
    example: 'Skills Updated successfully.',
  })
  message!: string;
  @ApiProperty({
    description: 'The meeting details returned from Database.',
    type: EditSkillDataDto,
  })
  data?: EditSkillDataDto[];
  @ApiProperty({
    description: 'Error message in case of failure.',
    example: 'Invalid API credentials.',
  })
  errors?: any;
}
