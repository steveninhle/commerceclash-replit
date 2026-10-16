import { ApiProperty } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';

export class UpsertSkillDataDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  value!: number;

  @ApiProperty()
  available_points!: number | null;

  @ApiProperty()
  updatedAt!: Date;
}

export class UpsertSkillResponseDto implements ApiResponse {
  success!: boolean;
  message!: string;
  data?: UpsertSkillDataDto;
  error?: any;
}
