import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class EditSkillRequestDto {
  @ApiProperty({ example: 'Problem Solving' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(0)
  value!: number;
}
