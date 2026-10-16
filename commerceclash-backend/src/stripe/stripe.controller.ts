import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import {
  CreatePaymentIntentDto,
  CreatePaymentIntentResponseDto,
  GetPriceResponseDto,
} from './dto/create-checkout.dto';

@ApiTags('stripe')
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('payment-intent')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Create a Stripe PaymentIntent for the choose-class card checkout',
  })
  async createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
  ): Promise<CreatePaymentIntentResponseDto> {
    const result = await this.stripeService.createRegistrationPaymentIntent(
      dto.cohortId,
      dto.email,
      dto.name,
      dto.checkoutId,
    );
    return { success: true, ...result };
  }

  @Get('check-email')
  @ApiOperation({
    summary: 'Fast check whether an email is already registered for a cohort (no Stripe call)',
  })
  async checkEmail(
    @Query('cohortId') cohortId: string,
    @Query('email') email: string,
  ): Promise<{ success: boolean; available: boolean; message?: string }> {
    const result = await this.stripeService.checkEmailAvailability(cohortId, email);
    return { success: true, ...result };
  }

  @Get('price')
  @ApiOperation({
    summary: 'Get the configured cohort price (amount + currency) for display before checkout',
  })
  async getPrice(): Promise<GetPriceResponseDto> {
    const { amount, currency } = await this.stripeService.getPrice();
    return { success: true, amount, currency };
  }

  @Get('session-status')
  @ApiOperation({ summary: 'Poll whether the webhook has finished processing a checkout session' })
  async getSessionStatus(@Query('sessionId') sessionId: string) {
    return this.stripeService.getSessionStatus(sessionId);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook receiver' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    await this.stripeService.handleWebhook(req, signature);
    return { received: true };
  }
}
