import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'The new password for the user', example: '123456789' })
  @IsString()
  @IsNotEmpty()
  newPassword!: string;
}
