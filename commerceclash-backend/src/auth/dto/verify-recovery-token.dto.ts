import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyRecoveryTokenDto {
  @ApiProperty({ description: 'Supabase recovery token_hash from a set-password/reset link' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
