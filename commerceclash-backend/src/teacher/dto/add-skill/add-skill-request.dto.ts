import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AddSkillRequestDto {
  @ApiProperty({ example: 'Problem Solving' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  value!: number;
}
