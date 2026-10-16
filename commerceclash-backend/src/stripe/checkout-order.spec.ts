import { BadRequestException, ConflictException } from '@nestjs/common';
import { checkout_orders } from '@prisma/client';
import { PrismaService } from '@utils/prisma/prisma.service';
import { AppConfigService } from '@utils/config/config.service';
import { SupabaseService } from '@utils/supabase/supabase.service';
import { CohortService } from '../cohort/cohort.service';
import { EmailService } from '../email/email.service';
import { StripeService } from './stripe.service';

const cohortId = 'd48f6c0a-f132-4c0f-9f30-dde740b9e1cb';
const checkoutId = 'ce16646d-2e99-49ef-ab42-968f89d28821';
const otherCheckoutId = 'c81c0a02-8cdf-4f52-92be-a62c70cbcf8d';
const email = 'student@example.test';

type Intent = {
  id: string;
  client_secret: string;
  status: string;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
};
type CreateParams = Omit<Intent, 'id' | 'client_secret' | 'status'>;

function fixture() {
  let order: checkout_orders | null = null;
  let queue = Promise.resolve();
  const intents = new Map<string, Intent>();
  const createdByKey = new Map<string, Intent>();
  const classRow = {
    id: cohortId,
    name: 'Test class',
    max_students: 2,
    is_public: true,
    status: 'active',
    archived_at: null as Date | null,
  };
  const tx = {
    cohorts: { findUnique: jest.fn(() => Promise.resolve({ ...classRow })) },
    cohort_students: {
      count: jest.fn(() => Promise.resolve(0)),
      findFirst: jest.fn(() => Promise.resolve(null)),
    },
    $queryRaw: jest.fn(() => Promise.resolve([{ id: order?.id }])),
    checkout_orders: {
      count: jest.fn(() => Promise.resolve(0)),
      findUniqueOrThrow: jest.fn(() => Promise.resolve({ ...order! })),
      update: jest.fn(
        ({
          data,
        }: {
          data: Partial<Omit<checkout_orders, 'attempt'>> & { attempt?: { increment: number } };
        }) => {
          order = { ...order!, ...data, attempt: order!.attempt + (data.attempt?.increment ?? 0) };
          return Promise.resolve({ ...order });
        },
      ),
    },
  };
  const prisma = {
    cohorts: { findUnique: jest.fn(() => Promise.resolve({ ...classRow })) },
    checkout_orders: {
      findMany: jest.fn(() =>
        Promise.resolve(
          order?.seat_reserved &&
            order.reservation_expires_at &&
            order.reservation_expires_at <= new Date()
            ? [{ ...order }]
            : [],
        ),
      ),
      findUnique: jest.fn(
        ({
          where,
        }: {
          where: { checkout_key?: string; cohort_id_email?: { cohort_id: string; email: string } };
        }) => {
          const match =
            order &&
            (where.checkout_key
              ? order.checkout_key === where.checkout_key
              : order.cohort_id === where.cohort_id_email?.cohort_id &&
                order.email === where.cohort_id_email.email);
          return Promise.resolve(match ? { ...order } : null);
        },
      ),
      upsert: jest.fn(
        ({
          create,
        }: {
          create: Omit<
            checkout_orders,
            | 'id'
            | 'created_at'
            | 'attempt'
            | 'payment_intent_id'
            | 'seat_reserved'
            | 'reservation_expires_at'
            | 'fulfilled_at'
          >;
        }) => {
          order ??= {
            id: 'f29f30a2-18de-4461-ab19-dfeff470bb2a',
            created_at: new Date(),
            attempt: 1,
            payment_intent_id: null,
            seat_reserved: false,
            reservation_expires_at: null,
            fulfilled_at: null,
            ...create,
          };
          return Promise.resolve({ ...order });
        },
      ),
    },
    users: { findFirst: jest.fn(() => Promise.resolve(null)) },
    $transaction: jest.fn(async (work: (client: typeof tx) => Promise<unknown>) => {
      const previous = queue;
      let release!: () => void;
      queue = new Promise<void>((resolve) => {
        release = resolve;
      });
      await previous;
      const original = order ? { ...order } : null;
      try {
        return await work(tx);
      } catch (error) {
        order = original;
        throw error;
      } finally {
        release();
      }
    }),
  };
  const stripe = {
    prices: { retrieve: jest.fn(() => Promise.resolve({ unit_amount: 10000, currency: 'usd' })) },
    paymentIntents: {
      create: jest.fn((params: CreateParams, options: { idempotencyKey: string }) => {
        let intent = createdByKey.get(options.idempotencyKey);
        if (!intent) {
          intent = {
            ...params,
            id: `pi_${intents.size + 1}`,
            client_secret: `secret_${intents.size + 1}`,
            status: 'requires_payment_method',
          };
          intents.set(intent.id, intent);
          createdByKey.set(options.idempotencyKey, intent);
        }
        return Promise.resolve({ ...intent });
      }),
      retrieve: jest.fn((id: string) => Promise.resolve({ ...intents.get(id)! })),
      cancel: jest.fn((id: string) => {
        intents.get(id)!.status = 'canceled';
        return Promise.resolve({ ...intents.get(id)! });
      }),
    },
  };
  const cohort = {
    findOne: jest.fn(() => Promise.resolve({ name: 'Test class', available_spots: 2 })),
    isEnrolled: jest.fn(() => Promise.resolve(false)),
  };
  const makeService = () => {
    const service = new StripeService(
      prisma as unknown as PrismaService,
      {
        stripeSecretKey: 'sk_test_placeholder',
        get: () => 'price_test',
      } as unknown as AppConfigService,
      {} as SupabaseService,
      cohort as unknown as CohortService,
      {} as EmailService,
    );
    Object.defineProperty(service, 'stripe', { value: stripe });
    return service;
  };
  const service = makeService();
  const submit = (key = checkoutId, name = 'Student', inputEmail = email) =>
    service.createRegistrationPaymentIntent(cohortId, inputEmail, name, key);
  return {
    service,
    makeService,
    submit,
    prisma,
    tx,
    stripe,
    cohort,
    classRow,
    intents,
    order: () => order!,
  };
}

describe('Durable checkout PaymentIntents', () => {
  it('reuses one intent across sequential retries and normalizes email identity', async () => {
    const f = fixture();
    const first = await f.submit();
    expect(await f.submit(checkoutId, 'Edited name', ' STUDENT@example.test ')).toEqual(first);
    expect(f.stripe.paymentIntents.create).toHaveBeenCalledTimes(1);
    expect(f.order().payment_intent_id).toBe(first.paymentIntentId);
    expect(f.tx.$queryRaw).toHaveBeenCalledTimes(4);
  });

  it('serializes simultaneous requests across separate service instances', async () => {
    const f = fixture();
    const other = f.makeService();
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        (i % 2 ? f.service : other).createRegistrationPaymentIntent(
          cohortId,
          email,
          'Student',
          checkoutId,
        ),
      ),
    );
    expect(new Set(results.map((result) => result.paymentIntentId)).size).toBe(1);
    expect(f.stripe.paymentIntents.create).toHaveBeenCalledTimes(1);
  });

  it('keeps a saved intent after the Stripe idempotency retention window', async () => {
    const f = fixture();
    const first = await f.submit();
    f.order().created_at = new Date(Date.now() - 7 * 86400000);
    f.stripe.prices.retrieve.mockRejectedValue(
      new Error('Price lookup must not recreate checkout'),
    );
    expect(await f.submit()).toEqual(first);
    expect(f.stripe.paymentIntents.create).toHaveBeenCalledTimes(1);
  });

  it('uses the same key and immutable parameters after a lost Stripe response', async () => {
    const f = fixture();
    const create = f.stripe.paymentIntents.create.getMockImplementation()!;
    f.stripe.paymentIntents.create.mockImplementationOnce(async (params, options) => {
      await create(params, options);
      throw new Error('Response lost');
    });
    await expect(f.submit()).rejects.toThrow('Response lost');
    expect(f.order().payment_intent_id).toBeNull();
    await f.submit(checkoutId, 'Edited name');
    expect(f.stripe.paymentIntents.create.mock.calls[1]).toEqual(
      f.stripe.paymentIntents.create.mock.calls[0],
    );
    expect(f.intents.size).toBe(1);
  });

  it('does not release a secret before the intent ID is saved, and safely retries a failed save', async () => {
    const f = fixture();
    f.tx.checkout_orders.update
      .mockImplementationOnce(f.tx.checkout_orders.update.getMockImplementation()!)
      .mockRejectedValueOnce(new Error('Save failed'));
    await expect(f.submit()).rejects.toThrow('Save failed');
    expect(f.order().payment_intent_id).toBeNull();
    const result = await f.submit();
    expect(result.paymentIntentId).toBe('pi_1');
    expect(f.intents.size).toBe(1);
  });

  it.each(['processing', 'succeeded', 'requires_capture'])(
    'resumes %s without creating or exposing another payable intent',
    async (status) => {
      const f = fixture();
      const first = await f.submit();
      f.intents.get(first.paymentIntentId)!.status = status;
      const resumed = await f.submit(otherCheckoutId);
      expect(resumed).toMatchObject({
        paymentIntentId: first.paymentIntentId,
        status,
        clientSecret: null,
      });
      expect(f.stripe.paymentIntents.create).toHaveBeenCalledTimes(1);
    },
  );

  it('blocks a second browser from creating another payment or receiving the original secret', async () => {
    const f = fixture();
    await f.submit();
    await expect(f.submit(otherCheckoutId)).rejects.toBeInstanceOf(ConflictException);
    expect(f.stripe.paymentIntents.create).toHaveBeenCalledTimes(1);
  });

  it('rejects using a checkout key with a different email', async () => {
    const f = fixture();
    await f.submit();
    await expect(f.submit(checkoutId, 'Student', 'someone@example.test')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(f.stripe.paymentIntents.create).toHaveBeenCalledTimes(1);
  });

  it('creates a fresh attempt only when the previous intent is canceled', async () => {
    const f = fixture();
    const first = await f.submit();
    f.intents.get(first.paymentIntentId)!.status = 'canceled';
    const second = await f.submit(otherCheckoutId);
    expect(second.paymentIntentId).not.toBe(first.paymentIntentId);
    expect(f.order()).toMatchObject({ attempt: 2, checkout_key: otherCheckoutId });
    expect(f.stripe.paymentIntents.create.mock.calls.map((call) => call[1].idempotencyKey)).toEqual(
      [`checkout-order:${f.order().id}:1`, `checkout-order:${f.order().id}:2`],
    );
  });

  it('persists replacement parameters even if Stripe fails before returning the new intent', async () => {
    const f = fixture();
    const first = await f.submit();
    f.intents.get(first.paymentIntentId)!.status = 'canceled';
    f.stripe.prices.retrieve.mockResolvedValue({ unit_amount: 12000, currency: 'usd' });
    f.stripe.paymentIntents.create.mockRejectedValueOnce(new Error('Stripe unavailable'));
    await expect(f.submit()).rejects.toThrow('Stripe unavailable');
    expect(f.order()).toMatchObject({ attempt: 2, amount: 12000, payment_intent_id: null });
    f.stripe.prices.retrieve.mockResolvedValue({ unit_amount: 15000, currency: 'usd' });
    const second = await f.submit();
    expect(second.amount).toBe(12000);
    expect(f.stripe.paymentIntents.create.mock.calls[2]).toEqual(
      f.stripe.paymentIntents.create.mock.calls[1],
    );
  });

  it('rejects a full class before creating a payable intent', async () => {
    const f = fixture();
    f.tx.cohort_students.count.mockResolvedValue(2);
    await expect(f.submit()).rejects.toBeInstanceOf(BadRequestException);
    expect(f.stripe.paymentIntents.create).not.toHaveBeenCalled();
  });
  it.each([
    { is_public: false },
    { status: 'archived' },
    { archived_at: new Date() },
    { max_students: 0 },
  ])('rejects an unavailable public class (%j)', async (change) => {
    const f = fixture();
    Object.assign(f.classRow, change);
    await expect(f.submit()).rejects.toBeInstanceOf(BadRequestException);
    expect(f.stripe.paymentIntents.create).not.toHaveBeenCalled();
  });

  it('cancels an unpaid intent before releasing its seat when the class becomes private', async () => {
    const f = fixture();
    const first = await f.submit();
    f.classRow.is_public = false;
    await expect(f.submit()).rejects.toBeInstanceOf(BadRequestException);
    expect(f.stripe.paymentIntents.cancel).toHaveBeenCalledWith(
      first.paymentIntentId,
      {},
      expect.any(Object),
    );
    expect(f.order().seat_reserved).toBe(false);
  });

  it('cancels an expired checkout before releasing capacity, then allows a fresh attempt', async () => {
    const f = fixture();
    const first = await f.submit();
    f.order().reservation_expires_at = new Date(Date.now() - 1);
    await f.service.expireCheckoutReservations();
    expect(f.intents.get(first.paymentIntentId)!.status).toBe('canceled');
    expect(f.order().seat_reserved).toBe(false);
    const second = await f.submit();
    expect(second.paymentIntentId).not.toBe(first.paymentIntentId);
    expect(f.order().seat_reserved).toBe(true);
  });

  it.each(['processing', 'succeeded', 'requires_capture'])(
    'retains an expired seat while payment is %s',
    async (status) => {
      const f = fixture();
      const first = await f.submit();
      f.order().reservation_expires_at = new Date(Date.now() - 1);
      f.intents.get(first.paymentIntentId)!.status = status;
      await f.service.expireCheckoutReservations();
      expect(f.order()).toMatchObject({ seat_reserved: true, reservation_expires_at: null });
      expect(f.stripe.paymentIntents.cancel).not.toHaveBeenCalled();
    },
  );

  it('retains the seat when cancellation loses a race to payment, then protects the accepted payment', async () => {
    const f = fixture();
    const first = await f.submit();
    f.order().reservation_expires_at = new Date(Date.now() - 1);
    f.stripe.paymentIntents.cancel.mockImplementationOnce(() => {
      f.intents.get(first.paymentIntentId)!.status = 'succeeded';
      return Promise.reject(new Error('Already succeeded'));
    });
    await f.service.expireCheckoutReservations();
    expect(f.order().seat_reserved).toBe(true);
    await f.service.expireCheckoutReservations();
    expect(f.order()).toMatchObject({ seat_reserved: true, reservation_expires_at: null });
  });

  it('counts other reservations even after their timestamp expires until cancellation is confirmed', async () => {
    const f = fixture();
    f.tx.checkout_orders.count.mockResolvedValue(2);
    await expect(f.submit()).rejects.toBeInstanceOf(BadRequestException);
    expect(f.stripe.paymentIntents.create).not.toHaveBeenCalled();
  });
});
