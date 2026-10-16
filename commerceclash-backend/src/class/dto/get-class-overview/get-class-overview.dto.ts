import { ApiProperty } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';

export class ClassOverviewSkills {
  @ApiProperty({ example: 2 }) team!: number;
  @ApiProperty({ example: 4 }) logistics!: number;
  @ApiProperty({ example: 0 }) marketing!: number;
  @ApiProperty({ example: 3 }) innovation!: number;
  @ApiProperty({ example: 1 }) quality!: number;
}

export class ClassOverviewPerk {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'early_adopter' }) key!: string;
  @ApiProperty({ example: 'Early Adopter' }) title!: string;
  @ApiProperty({ example: 'Some description', nullable: true }) description!: string | null;
  @ApiProperty({ example: 'pending', nullable: true }) perk_status!: string | null;
  @ApiProperty({ example: true }) is_unlocked!: boolean;
  @ApiProperty({ example: false }) is_used!: boolean;
  @ApiProperty({ example: false, nullable: true }) is_approved!: boolean | null;
  @ApiProperty({ example: false }) is_coded!: boolean;
  @ApiProperty({ example: false }) is_repeatable!: boolean;
  @ApiProperty({ example: true }) auto_approve!: boolean;
  @ApiProperty({ example: null, nullable: true }) last_used_at!: Date | null;
  @ApiProperty({ example: null, nullable: true }) next_available_at!: Date | null;
}

export class ClassOverviewCeo {
  @ApiProperty({ example: 'uuid', nullable: true }) id!: string | null;
  @ApiProperty({ example: 'Tech Titan', nullable: true }) title!: string | null;
}

export class ClassOverviewStudent {
  @ApiProperty({ example: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Alex Rivera', nullable: true }) name!: string | null;
  @ApiProperty({ type: ClassOverviewCeo, nullable: true }) ceo!: ClassOverviewCeo;
  @ApiProperty({ example: 12 }) level!: number;
  @ApiProperty({ example: 4250 }) xp!: number;
  @ApiProperty({ example: 12.4 }) market_share!: number;
  @ApiProperty({ type: ClassOverviewSkills }) skills!: ClassOverviewSkills;
  @ApiProperty({ type: [ClassOverviewPerk] }) perks!: ClassOverviewPerk[];
}

export class GetClassOverviewResponse implements ApiResponse {
  @ApiProperty({ example: true }) success!: boolean;
  @ApiProperty({ example: 'Class overview fetched successfully' }) message!: string;
  @ApiProperty({ type: [ClassOverviewStudent], nullable: true }) data?: ClassOverviewStudent[];
  @ApiProperty({ nullable: true }) error?: any;
}
