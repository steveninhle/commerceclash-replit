import { ApiProperty } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';

export class Ceo {
  id!: string | null;
  title!: string | null;
}
export class GetStudentInfo {
  @ApiProperty({ example: 'a1b2c3d4', description: 'Unique identifier of the student' })
  id!: string;

  @ApiProperty({ example: 'Alice Johnson', description: 'Full name of the student' })
  name!: string | null;

  @ApiProperty({ example: 150, description: 'Current XP of the student' })
  xp!: number | null;

  @ApiProperty({ example: false, description: 'Indicates if the student is the CEO (team leader)' })
  ceo!: Ceo;
}

export class GetStudentXpData {
  @ApiProperty({ example: true, description: 'Indicates whether XP was successfully updated' })
  is_xp_set!: boolean;

  @ApiProperty({
    type: [GetStudentInfo],
    description: 'List of students with their updated XP and related info',
  })
  students!: GetStudentInfo[];
}

export class GetStudentXpResponse implements ApiResponse {
  @ApiProperty({ example: true, description: 'Whether the operation succeeded' })
  success!: boolean;

  @ApiProperty({ example: 'XP updated successfully', description: 'Response message' })
  message!: string;

  @ApiProperty({
    type: GetStudentXpData,
    description: 'Response data containing XP update details',
  })
  data?: GetStudentXpData;

  error?: any;
}
