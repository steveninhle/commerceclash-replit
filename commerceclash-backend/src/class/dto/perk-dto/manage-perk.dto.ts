import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManagePerkDto {
  @ApiProperty({ description: 'Class ID' })
  @IsString()
  classId!: string;

  @ApiProperty({ description: 'Student ID' })
  @IsString()
  studentId!: string;

  @ApiProperty({ description: 'Perk ID' })
  @IsString()
  perkId!: string;

  @ApiProperty({ description: 'Action to perform', enum: ['lock', 'unlock', 'reset'] })
  @IsIn(['lock', 'unlock', 'reset'])
  action!: 'lock' | 'unlock' | 'reset';

  @ApiProperty({ description: 'Teacher ID' })
  @IsString()
  teacherId!: string;
}
