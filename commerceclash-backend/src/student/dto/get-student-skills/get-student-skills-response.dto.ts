import { ApiProperty } from '@nestjs/swagger';
import { ApiResponse as IApiResponse } from '@utils/common/interfaces/interfaces';

export class StudentSkillDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  value!: number;

  @ApiProperty({ description: 'Signed scenario modifier; never allocatable or refundable' })
  temporaryValue!: number;

  @ApiProperty({ description: 'Permanent value plus scenario modifiers, clamped to 0-8' })
  effectiveValue!: number;
}

export class StudentSkillDataDto {
  skills!: StudentSkillDto[];
  available_points!: number;
  skill_unlocked!: boolean;
  is_shifting!: boolean;
  shifting_points!: number;
}

export class GetStudentSkillsResponseDto implements IApiResponse {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Skill Updated Successfully' })
  message!: string;

  @ApiProperty({ type: [StudentSkillDto], required: false })
  data?: StudentSkillDataDto;

  @ApiProperty({ required: false })
  error?: any;
}
