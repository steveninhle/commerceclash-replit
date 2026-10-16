import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiResponse } from '@utils/common/interfaces/interfaces';

export class GetCeoPerkResponseData {
  @ApiProperty({ description: 'UUID of the perk', example: '6be3c80b-87d5-4802-abed-dcc4a648dd8c' })
  id!: string;

  @ApiProperty({ description: 'Name of the perk', example: 'Afterburner' })
  title!: string;

  @ApiPropertyOptional({
    description: 'What the perk does',
    example: 'Add +2 temporary skill points for 1 scenario.',
    nullable: true,
  })
  description!: string | null;
}

export class GetCeoResponseData {
  @ApiProperty({ description: 'UUid of CEO', example: '33c79b21-7224-40b5-8d13-d1a3b0b4a675' })
  id!: string;
  @ApiProperty({ description: 'Title of CEO', example: 'The Baron' })
  title!: string;
  @ApiProperty({ description: 'Sub-title of CEO', example: 'Tyrant Of Wealth' })
  sub_title!: string;

  @ApiProperty({
    description: 'Perks available to this CEO archetype',
    type: [GetCeoPerkResponseData],
  })
  perks!: GetCeoPerkResponseData[];
}

export class GetCeoResponse implements ApiResponse {
  @ApiProperty({
    description: 'Indicates whether the request was successful.',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'A human-readable message describing the result.',
    example: 'CEO fetch successfully.',
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'Response payload containing All 6 CEO',
    type: GetCeoResponseData,
  })
  data?: GetCeoResponseData[];

  @ApiPropertyOptional({
    description: 'Error details if the request failed.',
    example: 'Failed to create class',
  })
  error?: string;
}
