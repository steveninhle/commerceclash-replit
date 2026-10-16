import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { SupabaseAuthGuard } from '@utils/common/guards/supabase-auth.guard';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

describe('Choose-class checkout API', () => {
  let app: INestApplication;
  const checkoutId = 'ce16646d-2e99-49ef-ab42-968f89d28821';
  const cohortId = 'b4ecdc80-ef20-4da4-bd24-4e5d2fd1efc0';
  const stripeService = {
    createRegistrationPaymentIntent: jest.fn(),
    getPrice: jest.fn(),
    getSessionStatus: jest.fn(),
    handleWebhook: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [StripeController, AuthController],
      providers: [
        { provide: StripeService, useValue: stripeService },
        { provide: AuthService, useValue: {} },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication({ rawBody: true });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.listen(0, '127.0.0.1');
  });

  beforeEach(() => {
    jest.resetAllMocks();
    stripeService.createRegistrationPaymentIntent.mockResolvedValue({
      clientSecret: 'mock_client_secret',
      paymentIntentId: 'pi_test',
      status: 'requires_payment_method',
      amount: 10000,
      currency: 'usd',
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  it.each(['/auth/signup', '/stripe/register', '/stripe/create-checkout-session'])(
    'retires the public entry point %s',
    async (url) => {
      await request(app.getHttpServer())
        .post(url)
        .send({ checkoutId, cohortId, email: 'student@example.com', password: 'Password123!' })
        .expect(404);
      expect(stripeService.createRegistrationPaymentIntent).not.toHaveBeenCalled();
    },
  );

  it('creates the retained embedded payment with a normalized email and customer name', async () => {
    await request(app.getHttpServer())
      .post('/stripe/payment-intent')
      .send({ checkoutId, cohortId, email: ' STUDENT@example.com ', name: 'Jane Doe' })
      .expect(200)
      .expect({
        success: true,
        clientSecret: 'mock_client_secret',
        paymentIntentId: 'pi_test',
        status: 'requires_payment_method',
        amount: 10000,
        currency: 'usd',
      });

    expect(stripeService.createRegistrationPaymentIntent).toHaveBeenCalledWith(
      cohortId,
      'student@example.com',
      'Jane Doe',
      checkoutId,
    );
  });

  it('rejects upfront passwords instead of creating pending password registrations', async () => {
    await request(app.getHttpServer())
      .post('/stripe/payment-intent')
      .send({ checkoutId, cohortId, email: 'student@example.com', password: 'Password123!' })
      .expect(400);
    expect(stripeService.createRegistrationPaymentIntent).not.toHaveBeenCalled();
  });

  it('rejects an invalid cohort before creating a payment', async () => {
    await request(app.getHttpServer())
      .post('/stripe/payment-intent')
      .send({ checkoutId, cohortId: 'invalid', email: 'student@example.com' })
      .expect(400);
    expect(stripeService.createRegistrationPaymentIntent).not.toHaveBeenCalled();
  });

  it.each([undefined, 'invalid'])('rejects a missing or invalid checkout key (%s)', async (key) => {
    await request(app.getHttpServer())
      .post('/stripe/payment-intent')
      .send({ cohortId, email: 'student@example.com', checkoutId: key })
      .expect(400);
    expect(stripeService.createRegistrationPaymentIntent).not.toHaveBeenCalled();
  });

  it('keeps price lookup available for the choose-class checkout', async () => {
    stripeService.getPrice.mockResolvedValue({ amount: 10000, currency: 'usd' });
    await request(app.getHttpServer())
      .get('/stripe/price')
      .expect(200)
      .expect({ success: true, amount: 10000, currency: 'usd' });
  });

  it('preserves status polling for payments that were already started', async () => {
    stripeService.getSessionStatus.mockResolvedValue({ status: 'completed' });
    await request(app.getHttpServer())
      .get('/stripe/session-status')
      .query({ sessionId: 'cs_legacy' })
      .expect(200)
      .expect({ status: 'completed' });
    expect(stripeService.getSessionStatus).toHaveBeenCalledWith('cs_legacy');
  });

  it('preserves webhook signature and raw payload delegation', async () => {
    const payload = { id: 'evt_legacy', type: 'checkout.session.completed' };
    await request(app.getHttpServer())
      .post('/stripe/webhook')
      .set('stripe-signature', 'mock_signature')
      .send(payload)
      .expect(200)
      .expect({ received: true });

    const [req, signature] = stripeService.handleWebhook.mock.calls[0];
    expect(req.rawBody).toEqual(Buffer.from(JSON.stringify(payload)));
    expect(signature).toBe('mock_signature');
  });
});
