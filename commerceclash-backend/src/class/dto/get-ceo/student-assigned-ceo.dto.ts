import { ApiProperty } from '@nestjs/swagger';
import { perk_status } from '@prisma/client';
import { ApiResponse } from '@utils/common/interfaces/interfaces';

class Perk {
  @ApiProperty({
    description: 'Unique identifier of the perk',
    example: '0494b19b-d085-4d64-879d-69cc5bf93e92',
  })
  id!: string;

  @ApiProperty({
    description: 'Title or name of the perk',
    example: 'Sabotage',
  })
  title!: string;

  @ApiProperty({
    description: 'Indicates whether the perk approval has been granted',
    example: true,
  })
  is_approved!: boolean | null;

  @ApiProperty({
    description: 'Detailed description of the perk (nullable)',
    example: 'Earn extra credit by completing additional tasks.',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    description: 'Indicates whether the perk is unlocked for the class',
    example: true,
  })
  is_unlocked!: boolean;

  @ApiProperty({
    description: 'Indicates whether the perk has been used/redeemed',
    example: false,
  })
  is_used!: boolean;

  @ApiProperty({
    description: 'Status of the perk (e.g., pending, approved, denied, used) (nullable)',
    example: 'pending',
    nullable: true,
  })
  perk_status!: perk_status | null;

  @ApiProperty({
    description: 'Unique key identifier for the perk',
    example: 'sabotage',
  })
  key?: string;
}

export class StudentAssignedCeoData {
  @ApiProperty({
    description: 'Unique identifier of the Ceo (nullable if not found)',
    example: '98800341-834f-49a1-b1e4-7bffde97bad9',
    nullable: true,
  })
  id!: string | null;

  @ApiProperty({
    description: 'Title of the Ceo',
    example: 'The Baron',
    nullable: true,
  })
  title!: string | undefined;

  @ApiProperty({
    description: 'Optional subtitle or tagline of the Ceo',
    example: 'Tyrant of wealth',
    nullable: true,
  })
  sub_title!: string | undefined;
  @ApiProperty({
    description: 'The experience points (XP) of the Ceo',
    example: 500,
    nullable: true,
  })
  xp!: number | null;
  @ApiProperty({
    description: 'The level of the Ceo',
    example: 5,
    nullable: true,
  })
  level!: number | null;
  @ApiProperty({
    description: 'List of perks associated with the Ceo',
    type: [Perk],
  })
  perks!: Perk[];
}

export class StudentAssignedCeoResponse implements ApiResponse {
  @ApiProperty({
    description: 'Indicates whether the request was successful',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Message describing the result of the operation',
    example: 'Class and perks fetched successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Data payload containing class details and its perks',
    type: StudentAssignedCeoData,
  })
  data!: StudentAssignedCeoData;

  @ApiProperty({
    description: 'Error details (if any occurred)',
    example: null,
    nullable: true,
  })
  error?: any;
}
