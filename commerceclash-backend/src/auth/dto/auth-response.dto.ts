import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';

export class PublicUserDto {
  @ApiProperty({ description: 'User ID', example: '3c8849d0-8e0d-41b4-a5d3-844d93b4e2ab' })
  id!: string;

  @ApiProperty({ description: 'User email', example: 'asad.ullah@texagon.io' })
  email!: string;

  @ApiProperty({ description: 'User name', example: 'John Doe', required: false })
  name?: string;

  @ApiProperty({ description: 'Role', example: 'student' })
  role?: string;

  @ApiProperty({ description: 'IsActive as a student', example: 'true' })
  is_active?: boolean;

  @ApiProperty({ description: 'Created at timestamp' })
  created_at!: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updated_at!: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  access_token?: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  refresh_token?: string;

  @ApiProperty({
    description: 'User information',
  })
  user!: PublicUserDto;

  @ApiProperty({
    description: 'Response message',
    required: false,
    example: 'User created. Please check your email for confirmation.',
  })
  message?: string;
}

export class AuthResponseApiDto implements ApiResponse {
  @ApiProperty({
    description: 'Indicates whether the operation was successful.',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'A human-readable message describing the result.',
    example: 'User signed in successfully.',
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'The authentication data including tokens and user info.',
    type: AuthResponseDto,
  })
  data?: AuthResponseDto;

  @ApiPropertyOptional({
    description: 'Error message in case of failure.',
    example: 'Invalid credentials.',
  })
  error?: string;
}
