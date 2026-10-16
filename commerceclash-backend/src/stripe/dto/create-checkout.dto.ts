import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Stable anonymous checkout key, reused for retries and refreshes' })
  @IsUUID('4')
  checkoutId!: string;

  @ApiProperty({ example: 'student@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'ID of the cohort to register for' })
  @IsUUID()
  cohortId!: string;

  @ApiProperty({ example: 'Jane Doe', required: false })
  @IsOptional()
  @IsString()
  name?: string;
}

export class CreatePaymentIntentResponseDto {
  success!: boolean;
  clientSecret!: string | null;
  paymentIntentId!: string;
  status!: string;
  amount!: number;
  currency!: string;
}

export class GetPriceResponseDto {
  success!: boolean;
  amount!: number;
  currency!: string;
}
