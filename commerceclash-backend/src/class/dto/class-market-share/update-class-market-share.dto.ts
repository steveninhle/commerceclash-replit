import { ApiProperty } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';
import { IsNotEmpty, IsNumber, IsUUID, Max, Min } from 'class-validator';

export class StudentMarketSharePair {
  @IsNotEmpty()
  @IsUUID('all')
  studentId!: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(500)
  marketShare!: number;
}
export class Ceo {
  id!: string | null;
  title!: string | null;
}
export class UpdatedStudentMarketShareInfo {
  @ApiProperty({ example: 'a1b2c3d4', description: 'Unique identifier of the student' })
  id!: string;

  @ApiProperty({ example: 'Alice Johnson', description: 'Full name of the student' })
  name!: string | null;

  @ApiProperty({ example: 150, description: 'Current market Share  of the student' })
  marketShare!: number | null;

  @ApiProperty({ example: false, description: 'Indicates if the student is the CEO (team leader)' })
  ceo!: Ceo;
}

export class UpdateStudentMarketShareData {
  @ApiProperty({
    example: true,
    description: 'Indicates whether market Share was successfully updated',
  })
  is_ms_set!: boolean;

  @ApiProperty({
    type: [UpdatedStudentMarketShareInfo],
    description: 'List of students with their updated market Share and related info',
  })
  students!: UpdatedStudentMarketShareInfo[];
}

export class UpdateStudentMarketShareResponse implements ApiResponse {
  @ApiProperty({ example: true, description: 'Whether the operation succeeded' })
  success!: boolean;

  @ApiProperty({ example: 'Market Share updated successfully', description: 'Response message' })
  message!: string;

  @ApiProperty({
    type: UpdateStudentMarketShareData,
    description: 'Response data containing market Share  update details',
  })
  data?: UpdateStudentMarketShareData;

  error?: any;
}
