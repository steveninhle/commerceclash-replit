import { Logger, RawBodyRequest } from '@nestjs/common';
import { createCipheriv, createHash } from 'crypto';
import { Request } from 'express';
import Stripe from 'stripe';
import { PrismaService } from '@utils/prisma/prisma.service';
import { AppConfigService } from '@utils/config/config.service';
import { SupabaseService } from '@utils/supabase/supabase.service';
import { CohortService } from '../cohort/cohort.service';
import { EmailService } from '../email/email.service';
import { StripeService } from './stripe.service';
import { checkout_orders } from '@prisma/client';

const email = 'student@example.test';
const user = { id: 'student-id', email, name: 'Student' };
const webhookSecret = 'whsec_test_placeholder';

function fixture({ local = false, authOnly = false, pendingEmail = false } = {}) {
  let localUser = local ? user : null;
  let authUser = local || authOnly ? user : null;
  let emailPending = pendingEmail;
  let completed = false;
  let enrolled = false;
  let outcome: string | null = null;

  const tx = {
    $queryRaw: jest.fn(() => Promise.resolve([])),
    checkout_orders: {
      findUnique: jest.fn((): Promise<Partial<checkout_orders> | null> => Promise.resolve(null)),
      update: jest.fn(() => Promise.resolve()),
      count: jest.fn(() => Promise.resolve(0)),
      updateMany: jest.fn(() => Promise.resolve()),
    },
    cohort_students: {
      findFirst: jest.fn(() => Promise.resolve(null)),
      findUnique: jest.fn(() => Promise.resolve(null)),
      upsert: jest.fn(() => {
        enrolled = true;
        return Promise.resolve();
      }),
      count: jest.fn(() => Promise.resolve(1)),
    },
    cohorts: {
      findUnique: jest.fn(() =>
        Promise.resolve({
          id: 'cohort-id',
          is_public: true,
          status: 'active',
          archived_at: null as Date | null,
          max_students: 2,
        }),
      ),
      update: jest.fn(() => Promise.resolve()),
    },
    renamedclass: { findMany: jest.fn(() => Promise.resolve([])) },
    stripe_events: {
      findFirst: jest.fn(() => Promise.resolve(outcome ? { outcome } : null)),
      upsert: jest.fn(() => {
        outcome = 'refunded';
        return Promise.resolve();
      }),
      updateMany: jest.fn(() => Promise.resolve()),
      create: jest.fn(({ data }: { data: { outcome?: string } }) => {
        outcome = data.outcome ?? 'completed';
        completed = outcome === 'completed';
        return Promise.resolve();
      }),
    },
  };
  const prisma = {
    users: {
      findFirst: jest.fn(() => Promise.resolve(localUser)),
      upsert: jest.fn(() => {
        localUser = user;
        return Promise.resolve(user);
      }),
    },
    roles: { findFirst: jest.fn(() => Promise.resolve({ id: 'student-role' })) },
    pending_registrations: {
      findUnique: jest.fn(
        (): Promise<{
          email: string;
          encrypted_password: string;
          expires_at: Date;
        } | null> => Promise.resolve(null),
      ),
      delete: jest.fn(() => Promise.resolve()),
    },
    stripe_events: {
      findUnique: jest.fn(() => Promise.resolve(outcome ? { id: 'record-id', outcome } : null)),
      findFirst: jest.fn(() => Promise.resolve(outcome ? { id: 'record-id', outcome } : null)),
    },
    $transaction: jest.fn((run: (client: typeof tx) => Promise<void>) => run(tx)),
  };
  Object.assign(tx, {
    users: prisma.users,
    roles: prisma.roles,
    pending_registrations: prisma.pending_registrations,
  });
  const supabase = {
    adminGetUserByEmail: jest.fn(() => Promise.resolve(authUser)),
    adminCreateUser: jest.fn(
      (_email: string, _password: string, _name?: string, pending = false) => {
        authUser = user;
        emailPending = pending;
        // Simulate the repository's auth.users -> public.users trigger.
        localUser = user;
        return Promise.resolve(user);
      },
    ),
    adminIsPasswordSetupEmailPending: jest.fn(() => Promise.resolve(emailPending)),
    adminSetPasswordSetupEmailPending: jest.fn((_id: string, pending: boolean) => {
      emailPending = pending;
      return Promise.resolve();
    }),
    adminGenerateRecoveryToken: jest.fn(() => Promise.resolve({ hashedToken: 'recovery-token' })),
    adminUpdateUserPassword: jest.fn(() => Promise.resolve()),
  };
  const emailService = { sendSetPasswordEmail: jest.fn(() => Promise.resolve()) };
  const config = {
    stripeSecretKey: 'sk_test_placeholder',
    stripeWebhookSecret: webhookSecret,
    frontendUrl: 'https://checkout.example.test',
  };
  const service = new StripeService(
    prisma as unknown as PrismaService,
    config as AppConfigService,
    supabase as unknown as SupabaseService,
    {} as CohortService,
    emailService as unknown as EmailService,
  );
  const event = {
    id: 'evt_checkout',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_checkout',
        receipt_email: email,
        metadata: { cohortId: 'cohort-id', customerName: 'Student' },
      },
    },
  };
  const stripe = new Stripe(config.stripeSecretKey);
  const refund = jest
    .spyOn(stripe.refunds, 'create')
    .mockResolvedValue({ id: 're_test', status: 'succeeded' } as Awaited<
      ReturnType<typeof stripe.refunds.create>
    >);
  const listRefunds = jest
    .spyOn(stripe.refunds, 'list')
    .mockResolvedValue({ data: [], has_more: false } as unknown as Awaited<
      ReturnType<typeof stripe.refunds.list>
    >);
  Object.defineProperty(service, 'stripe', { value: stripe });
  const deliverEvent = (input: unknown) => {
    const payload = JSON.stringify(input);
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret });
    return service.handleWebhook(
      { rawBody: Buffer.from(payload) } as RawBodyRequest<Request>,
      signature,
    );
  };
  const deliver = () => deliverEvent(event);
  return {
    service,
    refund,
    listRefunds,
    deliverEvent,
    prisma,
    supabase,
    emailService,
    tx,
    deliver,
    state: () => ({ localUser, emailPending, completed, enrolled }),
  };
}

describe('Stripe password setup email delivery', () => {
  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  it('retries email failure after the auth trigger creates a local user', async () => {
    const f = fixture();
    f.emailService.sendSetPasswordEmail.mockRejectedValueOnce(new Error('Email unavailable'));

    await expect(f.deliver()).rejects.toThrow('Email unavailable');
    expect(f.state()).toMatchObject({
      localUser: user,
      emailPending: true,
      completed: false,
      enrolled: false,
    });
    expect(await f.service.getSessionStatus('pi_checkout')).toEqual({ status: 'pending' });

    await f.deliver();
    expect(f.emailService.sendSetPasswordEmail).toHaveBeenCalledTimes(2);
    expect(f.emailService.sendSetPasswordEmail).toHaveBeenLastCalledWith(
      email,
      'https://checkout.example.test/set-password?token=recovery-token&type=recovery',
      'Student',
    );
    expect(f.supabase.adminCreateUser).toHaveBeenCalledTimes(1);
    expect(f.supabase.adminCreateUser).toHaveBeenCalledWith(
      email,
      expect.any(String),
      'Student',
      true,
    );
    expect(f.supabase.adminUpdateUserPassword).not.toHaveBeenCalled();
    expect(f.state()).toMatchObject({ emailPending: false, completed: true, enrolled: true });
    expect(await f.service.getSessionStatus('pi_checkout')).toEqual({ status: 'completed' });

    await f.deliver();
    expect(f.emailService.sendSetPasswordEmail).toHaveBeenCalledTimes(2);
    expect(f.tx.stripe_events.create).toHaveBeenCalledTimes(1);
  });

  it('keeps failing webhook attempts pending until email delivery succeeds', async () => {
    const f = fixture();
    f.emailService.sendSetPasswordEmail
      .mockRejectedValueOnce(new Error('First email failure'))
      .mockRejectedValueOnce(new Error('Second email failure'));
    await expect(f.deliver()).rejects.toThrow('First email failure');
    await expect(f.deliver()).rejects.toThrow('Second email failure');
    expect(f.state()).toMatchObject({ emailPending: true, completed: false, enrolled: false });
    await f.deliver();
    expect(f.emailService.sendSetPasswordEmail).toHaveBeenCalledTimes(3);
    expect(f.supabase.adminCreateUser).toHaveBeenCalledTimes(1);
    expect(f.state().completed).toBe(true);
  });

  it('retries recovery token generation without losing pending delivery', async () => {
    const f = fixture();
    f.supabase.adminGenerateRecoveryToken.mockRejectedValueOnce(new Error('Token unavailable'));
    await expect(f.deliver()).rejects.toThrow('Token unavailable');
    expect(f.state()).toMatchObject({ emailPending: true, completed: false });
    expect(f.emailService.sendSetPasswordEmail).not.toHaveBeenCalled();
    await f.deliver();
    expect(f.emailService.sendSetPasswordEmail).toHaveBeenCalledTimes(1);
    expect(f.state().completed).toBe(true);
  });

  it('does not resend an accepted email when enrollment fails and is retried', async () => {
    const f = fixture();
    f.tx.cohort_students.upsert.mockRejectedValueOnce(new Error('Database unavailable'));
    await expect(f.deliver()).rejects.toThrow('Database unavailable');
    expect(f.state()).toMatchObject({ emailPending: false, completed: false, enrolled: false });
    await f.deliver();
    expect(f.emailService.sendSetPasswordEmail).toHaveBeenCalledTimes(1);
    expect(f.state()).toMatchObject({ completed: true, enrolled: true });
  });

  it('does not complete checkout if saving delivery acknowledgement fails', async () => {
    const f = fixture();
    f.supabase.adminSetPasswordSetupEmailPending.mockRejectedValueOnce(
      new Error('Metadata unavailable'),
    );
    await expect(f.deliver()).rejects.toThrow('Metadata unavailable');
    expect(f.state()).toMatchObject({ emailPending: true, completed: false });
    await f.deliver();
    expect(f.emailService.sendSetPasswordEmail).toHaveBeenCalledTimes(2);
    expect(f.state()).toMatchObject({ emailPending: false, completed: true });
  });

  it('preserves established accounts without sending a password setup email', async () => {
    const f = fixture({ local: true });
    await f.deliver();
    expect(f.emailService.sendSetPasswordEmail).not.toHaveBeenCalled();
    expect(f.supabase.adminGenerateRecoveryToken).not.toHaveBeenCalled();
    expect(f.supabase.adminUpdateUserPassword).not.toHaveBeenCalled();
    expect(f.state()).toMatchObject({ completed: true, enrolled: true });
  });

  it('records pending delivery for an auth-only account and provisions it after email succeeds', async () => {
    const f = fixture({ authOnly: true });
    f.emailService.sendSetPasswordEmail.mockRejectedValueOnce(new Error('Email unavailable'));
    await expect(f.deliver()).rejects.toThrow('Email unavailable');
    expect(f.supabase.adminSetPasswordSetupEmailPending).toHaveBeenCalledWith(user.id, true);
    expect(f.state()).toMatchObject({ localUser: null, emailPending: true, completed: false });
    await f.deliver();
    expect(f.emailService.sendSetPasswordEmail).toHaveBeenCalledTimes(2);
    expect(f.supabase.adminCreateUser).not.toHaveBeenCalled();
    expect(f.state()).toMatchObject({ localUser: user, completed: true, enrolled: true });
  });

  it('records pending delivery when another request wins the auth account creation race', async () => {
    const f = fixture();
    f.supabase.adminCreateUser.mockRejectedValueOnce(new Error('User already registered'));
    f.supabase.adminGetUserByEmail.mockResolvedValueOnce(null).mockResolvedValueOnce(user);
    f.emailService.sendSetPasswordEmail.mockRejectedValueOnce(new Error('Email unavailable'));
    await expect(f.deliver()).rejects.toThrow('Email unavailable');
    expect(f.state()).toMatchObject({ localUser: null, emailPending: true, completed: false });
    await f.deliver();
    expect(f.emailService.sendSetPasswordEmail).toHaveBeenCalledTimes(2);
    expect(f.state().completed).toBe(true);
  });

  it('preserves legacy upfront password synchronization', async () => {
    const f = fixture({ local: true });
    const iv = Buffer.alloc(16, 1);
    const key = createHash('sha256').update(webhookSecret).digest();
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update('LegacyPassword123!'), cipher.final()]);
    f.prisma.pending_registrations.findUnique.mockResolvedValue({
      email,
      encrypted_password: `${iv.toString('hex')}:${encrypted.toString('hex')}`,
      expires_at: new Date(Date.now() + 60000),
    });
    await f.deliver();
    expect(f.supabase.adminUpdateUserPassword).toHaveBeenCalledWith(user.id, 'LegacyPassword123!');
    expect(f.supabase.adminIsPasswordSetupEmailPending).not.toHaveBeenCalled();
    expect(f.emailService.sendSetPasswordEmail).not.toHaveBeenCalled();
    expect(f.prisma.pending_registrations.delete).toHaveBeenCalled();
  });
  it('requests a refund for an unreserved paid customer when the class is full, without creating an account or sending email', async () => {
    const f = fixture();
    f.tx.cohort_students.count.mockResolvedValue(2);
    await f.deliver();
    expect(f.refund).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: 'pi_checkout' }),
      expect.objectContaining({ idempotencyKey: 'unavailable-enrollment:pi_checkout' }),
    );
    expect(f.supabase.adminCreateUser).not.toHaveBeenCalled();
    expect(f.emailService.sendSetPasswordEmail).not.toHaveBeenCalled();
    expect(f.tx.cohort_students.upsert).not.toHaveBeenCalled();
    expect(await f.service.getSessionStatus('pi_checkout')).toEqual({ status: 'refunded' });
  });

  it('retries a failed refund using the same key even if capacity later becomes available', async () => {
    const f = fixture();
    f.tx.cohort_students.count.mockResolvedValue(2);
    f.refund.mockRejectedValueOnce(new Error('Refund response lost'));
    await expect(f.deliver()).rejects.toThrow('Refund response lost');
    expect(await f.service.getSessionStatus('pi_checkout')).toEqual({ status: 'pending' });
    f.tx.cohort_students.count.mockResolvedValue(0);
    await f.deliver();
    expect(f.refund.mock.calls[0]).toEqual(f.refund.mock.calls[1]);
    expect(f.emailService.sendSetPasswordEmail).not.toHaveBeenCalled();
    expect(await f.service.getSessionStatus('pi_checkout')).toEqual({ status: 'refunded' });
  });

  it('keeps a failed refund pending instead of claiming enrollment or refund success', async () => {
    const f = fixture();
    f.tx.cohort_students.count.mockResolvedValue(2);
    f.refund.mockResolvedValueOnce({ id: 're_failed', status: 'failed' } as Awaited<
      ReturnType<Stripe.Stripe['refunds']['create']>
    >);
    await expect(f.deliver()).rejects.toThrow('needs attention');
    expect(await f.service.getSessionStatus('pi_checkout')).toEqual({ status: 'pending' });
    expect(f.emailService.sendSetPasswordEmail).not.toHaveBeenCalled();
  });

  it('honors an already reserved paid seat after the class becomes private', async () => {
    const f = fixture();
    f.tx.cohorts.findUnique.mockResolvedValue({
      id: 'cohort-id',
      is_public: false,
      status: 'active',
      archived_at: null,
      max_students: 2,
    });
    f.tx.checkout_orders.findUnique.mockResolvedValue({
      id: 'order-id',
      cohort_id: 'cohort-id',
      email,
      seat_reserved: true,
    });
    await f.deliver();
    expect(f.refund).not.toHaveBeenCalled();
    expect(f.emailService.sendSetPasswordEmail).toHaveBeenCalledTimes(1);
    expect(f.tx.checkout_orders.update).toHaveBeenCalledWith({
      where: { id: 'order-id' },
      data: expect.objectContaining({ seat_reserved: false, fulfilled_at: expect.any(Date) }),
    });
    expect(await f.service.getSessionStatus('pi_checkout')).toEqual({ status: 'completed' });
  });

  it('does not fulfill or email an unpaid legacy Checkout Session', async () => {
    const f = fixture();
    await f.deliverEvent({
      id: 'evt_unpaid',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_unpaid',
          payment_status: 'unpaid',
          customer_details: { email },
          metadata: { cohortId: 'cohort-id' },
        },
      },
    });
    expect(f.prisma.$transaction).not.toHaveBeenCalled();
    expect(f.emailService.sendSetPasswordEmail).not.toHaveBeenCalled();
    expect(f.refund).not.toHaveBeenCalled();
  });
  it('reconciles an already accepted refund without creating another refund after a lost response', async () => {
    const f = fixture();
    f.tx.cohort_students.count.mockResolvedValue(2);
    f.listRefunds.mockResolvedValueOnce({
      data: [
        {
          id: 're_existing',
          status: 'succeeded',
          metadata: { unavailableEnrollment: 'pi_checkout' },
        },
      ],
      has_more: false,
    } as unknown as Awaited<ReturnType<Stripe.Stripe['refunds']['list']>>);
    await f.deliver();
    expect(f.refund).not.toHaveBeenCalled();
    expect(await f.service.getSessionStatus('pi_checkout')).toEqual({ status: 'refunded' });
    expect(f.emailService.sendSetPasswordEmail).not.toHaveBeenCalled();
  });
});
