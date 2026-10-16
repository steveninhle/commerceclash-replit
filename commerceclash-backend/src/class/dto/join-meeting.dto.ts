import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { RequiredZakIfHost, ValidateIfOneThenAll } from '@utils/common/validations/validators';
import { ApiProperty } from '@nestjs/swagger';

export class JoinMeetingRequestDto {
  @ApiProperty({
    description: 'Internal class or meeting ID',
    example: '12345',
  })
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({
    description: 'Role of the user: 0 = Attendee, 1 = Host',
    enum: [0, 1],
    example: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  role!: number;
}
@ValidateIfOneThenAll(['meetingNumber', 'role'])
export class JoinMeetingDto {
  @ApiProperty({
    description: 'Unique Zoom meeting number (digits only).',
    example: '9559840158',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/)
  meetingNumber!: string;

  @ApiProperty({
    description: 'Password required to join the Zoom meeting.',
    example: 'b5yzau',
  })
  @IsString()
  @IsNotEmpty()
  passWord!: string;

  @ApiProperty({
    description: 'Role of the user: 0 = Attendee, 1 = Host.',
    enum: [0, 1],
    example: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @IsIn([0, 1])
  role!: number;

  @ApiProperty({
    description: 'Display name of the user joining the meeting.',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  userName!: string;

  @ApiProperty({
    description: 'WebRTC video mode: 0 = off, 1 = on.',
    enum: [0, 1],
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @IsIn([0, 1])
  videoWebRtcMode!: number;

  @ApiProperty({
    description: 'Meeting token expiration time in seconds (min: 1800, max: 172800).',
    minimum: 1800,
    maximum: 172800,
    required: false,
    example: 3600,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1800)
  @Max(172800)
  expirationSeconds?: number;

  @ApiProperty({
    description: 'Email of the user joining the meeting (optional).',
    required: false,
    example: 'user@example.com',
  })
  @IsString()
  @IsOptional()
  userEmail?: string;

  @ApiProperty({
    description: 'Registrant token for authenticated registrants (optional).',
    required: false,
    example: 'ABCD1234XYZ',
  })
  @IsString()
  @IsOptional()
  registrantToken?: string;

  @ApiProperty({
    description: 'ZAK (Zoom Access Key) token. Required if user role = host.',
    required: false,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsOptional()
  @RequiredZakIfHost()
  zakToken?: string;
}
