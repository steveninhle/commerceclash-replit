import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class UpdateMetadataDto {
  @ApiProperty({
    description: 'User metadata as a JSON object',
    example: { preferences: { theme: 'dark' }, settings: { notifications: true } },
  })
  @IsObject()
  @IsOptional()
  metadata: Record<string, any> = {};
}
