import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SetSessionDto {
  @ApiProperty({ description: 'Supabase access token from reset link' })
  @IsString()
  @IsNotEmpty()
  accessToken!: string;

  @ApiProperty({ description: 'Supabase refresh token from reset link' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
