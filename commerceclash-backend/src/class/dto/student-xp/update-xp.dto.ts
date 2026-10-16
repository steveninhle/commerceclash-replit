import { ApiProperty } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';
import { IsNotEmpty, IsNumber, IsUUID, Max, Min } from 'class-validator';

export class StudentXpPair {
  @IsNotEmpty()
  @IsUUID('all')
  studentId!: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(500)
  xp!: number;
}
export class Ceo {
  id!: string | null;
  title!: string | null;
}
export class UpdatedStudentInfo {
  @ApiProperty({ example: 'a1b2c3d4', description: 'Unique identifier of the student' })
  id!: string;

  @ApiProperty({ example: 'Alice Johnson', description: 'Full name of the student' })
  name!: string | null;

  @ApiProperty({ example: 150, description: 'Current XP of the student' })
  xp!: number;

  @ApiProperty({ example: 3, description: 'Current level of the student based on XP' })
  level!: number;

  @ApiProperty({ example: false, description: 'Indicates if the student is the CEO (team leader)' })
  ceo!: Ceo;
}

export class UpdateStudentXpData {
  @ApiProperty({ example: true, description: 'Indicates whether XP was successfully updated' })
  is_xp_set!: boolean;

  @ApiProperty({
    type: [UpdatedStudentInfo],
    description: 'List of students with their updated XP and related info',
  })
  students!: UpdatedStudentInfo[];
}

export class UpdateStudentXpResponse implements ApiResponse {
  @ApiProperty({ example: true, description: 'Whether the operation succeeded' })
  success!: boolean;

  @ApiProperty({ example: 'XP updated successfully', description: 'Response message' })
  message!: string;

  @ApiProperty({
    type: UpdateStudentXpData,
    description: 'Response data containing XP update details',
  })
  data?: UpdateStudentXpData;

  error?: any;
}
