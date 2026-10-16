import { ApiProperty } from '@nestjs/swagger';
import { perk_status } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsString, ValidateNested } from 'class-validator';

// export enum PerkStatus {
//   REQUEST = 'request',
//   PENDING = 'pending',
//   APPROVED = 'approved',
//   DENIED = 'denied',
// }
export class Perks {
  @ApiProperty({
    example: '0494b19b-d085-4d64-879d-69cc5bf93e92',
    description: 'The ID of the perk',
  })
  @IsString()
  id!: string;
  @ApiProperty({
    example: 'Sabotage',
    description: 'The title of the perk',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    example: 'Earn extra credit by completing additional tasks.',
    description: 'The description of the perk',
  })
  @IsString()
  description!: string | null;

  @ApiProperty({
    example: perk_status.pending,
    enum: perk_status,
    description: 'Status of the perk (e.g., pending, approved, denied, used)',
  })
  @IsEnum(perk_status)
  perk_status!: perk_status | null;
}

export class Ceo {
  @ApiProperty({
    example: '98800341-834f-49a1-b1e4-7bffde97bad9',
    description: 'The ID of the ceo',
  })
  @IsString()
  id!: string | null;

  @ApiProperty({
    example: 'The Baron',
    description: 'The title of the ceo',
  })
  @IsString()
  name!: string | null;
}

export class StudentDto {
  @ApiProperty({
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'The ID of the student',
  })
  @IsString()
  id!: string;

  @ApiProperty({
    example: 'student@example.com',
    description: 'The email of the student',
  })
  @IsString()
  email!: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the student',
  })
  @IsString()
  name!: string | null;
  @ApiProperty({
    example: 1500,
    description: 'The experience points (XP) of the student',
  })
  @IsNumber()
  xp!: number | null;
  @ApiProperty({
    example: 5,
    description: 'The level of the student',
  })
  @IsNumber()
  level!: number | null;

  @ApiProperty({ type: () => Ceo, description: 'Contains id and title of the ceo ' })
  @ValidateNested()
  @Type(() => Ceo)
  ceo!: Ceo;

  @ApiProperty({
    type: () => [Perks],
    description: 'List of perks associated with the student',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Perks)
  perks!: Perks[];
}

export class GetStudentForClassResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the request was successful',
  })
  @IsBoolean()
  success!: boolean;

  @ApiProperty({
    example: 'Students found successfully',
    description: 'A message describing the outcome of the request',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    type: [StudentDto],
    description: 'The list of students enrolled in the class',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentDto)
  data!: StudentDto[];
}
