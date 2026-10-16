import { ApiProperty } from '@nestjs/swagger';
import { ApiResponse as IApiResponse } from '@utils/common/interfaces/interfaces';

export class ResetSkillsResponseDto implements IApiResponse {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Skill reset successful' })
  message!: string;

  @ApiProperty({ required: false, description: 'Optional ORM write result' })
  data?: any;

  @ApiProperty({ required: false })
  error?: any;
}
