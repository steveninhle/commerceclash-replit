import { ApiProperty } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';

export class SkillStatusData {
  @ApiProperty({
    description: 'A Binary value for check to know whethers the skills are locked',
    example: false,
  })
  skill_unlocked!: boolean;
}
export class GetSkillStatusResponse implements ApiResponse {
  @ApiProperty({ example: true, description: 'Whether the operation succeeded' })
  success!: boolean;

  @ApiProperty({ example: 'Skills are locked', description: 'Response message' })
  message!: string;

  @ApiProperty({ example: SkillStatusData })
  data?: SkillStatusData;

  @ApiProperty({ description: '' })
  error?: any;
}
