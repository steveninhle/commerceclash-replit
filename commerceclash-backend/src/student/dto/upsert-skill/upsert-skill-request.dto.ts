import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpsertSkillRequestDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0)
  @Max(8)
  value!: number;
}
