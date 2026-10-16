import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignCeoDto {
  @ApiProperty({ description: 'archetype id', example: '33c79b21-7224-40b5-8d13-d1a3b0b4a675' })
  @IsUUID('all')
  @IsNotEmpty()
  ceoId!: string;
}
