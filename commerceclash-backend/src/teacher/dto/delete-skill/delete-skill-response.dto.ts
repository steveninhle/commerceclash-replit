import { ApiProperty } from '@nestjs/swagger';
import { ApiResponse as IApiResponse } from '@utils/common/interfaces/interfaces';

export class DeleteSkillResponseDto implements IApiResponse {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Skill deleted successfully' })
  message!: string;

  @ApiProperty({ required: false })
  error?: any;
}
