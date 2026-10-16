import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetClassRequestDto {
  @ApiProperty({
    description: 'Instructor (user) UUID',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @IsUUID()
  @IsNotEmpty()
  instructorId!: string;
}
