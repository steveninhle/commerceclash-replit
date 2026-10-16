import { ApiProperty } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';

export class Ceo {
  id!: string | null;
  title!: string | null;
}
export class GetStudentMarketShareInfo {
  @ApiProperty({ example: 'a1b2c3d4', description: 'Unique identifier of the student' })
  id!: string;

  @ApiProperty({ example: 'Alice Johnson', description: 'Full name of the student' })
  name!: string | null;

  @ApiProperty({ example: 150, description: 'Current market share of the student' })
  market_share!: number | null;

  @ApiProperty({ example: false, description: 'Indicates if the student is the CEO (team leader)' })
  ceo!: Ceo;
}

export class GetStudentMarketShareData {
  @ApiProperty({
    example: true,
    description: 'Indicates whether market share was successfully updated',
  })
  is_ms_set!: boolean;

  @ApiProperty({
    type: [GetStudentMarketShareInfo],
    description: 'List of students with their updated market share and related info',
  })
  students!: GetStudentMarketShareInfo[];
}

export class GetStudentMarketShareResponse implements ApiResponse {
  @ApiProperty({ example: true, description: 'Whether the operation succeeded' })
  success!: boolean;

  @ApiProperty({ example: 'market share updated successfully', description: 'Response message' })
  message!: string;

  @ApiProperty({
    type: GetStudentMarketShareData,
    description: 'Response data containing market share update details',
  })
  data?: GetStudentMarketShareData;

  error?: any;
}
