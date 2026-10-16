import { ApiProperty } from '@nestjs/swagger';
import { ApiResponse as IApiResponse } from '@utils/common/interfaces/interfaces';

export class SkillSummaryDto {
  @ApiProperty({ description: 'Skill/Attribute UUID' })
  id!: string;

  @ApiProperty({ description: 'Skill name/label' })
  name!: string;
}

export class GetSkillsResponseDto implements IApiResponse {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Skills Fetched Successfully' })
  message!: string;

  @ApiProperty({ type: [SkillSummaryDto], required: false })
  data?: SkillSummaryDto[];

  @ApiProperty({ required: false })
  error?: any;
}
