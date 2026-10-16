import { BadRequestException, ConflictException, RawBodyRequest } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'child_process';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import Stripe from 'stripe';
import { PrismaService } from '@utils/prisma/prisma.service';
import { AppConfigService } from '@utils/config/config.service';
import { SupabaseService } from '@utils/supabase/supabase.service';
import { CohortService } from '../cohort/cohort.service';
import { ZoomMeetingService } from '../cohort/zoom-meeting.service';
import { EmailService } from '../email/email.service';
import { StripeService } from './stripe.service';

// Opt in with an isolated local database; never run against the app database.
const databaseUrl = process.env.CHECKOUT_TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
const cohortId = 'd48f6c0a-f132-4c0f-9f30-dde740b9e1cb';
const checkoutId = 'ce16646d-2e99-49ef-ab42-968f89d28821';
const otherCheckoutId = 'c81c0a02-8cdf-4f52-92be-a62c70cbcf8d';
const teacherId = '8a396eac-c935-4c29-95fd-f4e39ce280ba';
const manualStudentId = '1bcbdfc2-0d89-48de-b42c-413fe0e1cc9e';
const roleId = 'd671c64e-6a7e-4353-83ec-18b620950388';
const webhookSecret = 'whsec_database_test';
type Intent = {
  id: string;
  client_secret: string;
  status: string;
  amount: number;
  currency: string;
  receipt_email: string;
  metadata: Record<string, string>;
};
type Params = Omit<Intent, 'id' | 'client_secret' | 'status'>;

describeDatabase('Checkout capacity and idempotency PostgreSQL locking', () => {
  let prisma: PrismaClient;
  let cohort: CohortService;
  const sdk = new Stripe('sk_test_placeholder');
  const intents = new Map<string, Intent>();
  const byKey = new Map<string, Intent>();
  const emailPending = new Map<string, boolean>();
  const sendEmail = jest.fn(() => Promise.resolve());
  const refund = jest.fn(() => Promise.resolve({ id: 're_database_test', status: 'succeeded' }));
  const createIntent = jest.fn((params: Params, options: { idempotencyKey: string }) => {
    let intent = byKey.get(options.idempotencyKey);
    if (!intent) {
      intent = {
        ...params,
        id: `pi_database_${intents.size + 1}`,
        client_secret: 'test_secret',
        status: 'requires_payment_method',
      };
      intents.set(intent.id, intent);
      byKey.set(options.idempotencyKey, intent);
    }
    return Promise.resolve({ ...intent });
  });
  const updateAuthUser = (idOrEmail: string, isId: boolean) =>
    prisma.$transaction(async (authTx) => {
      // Fail quickly if the webhook holds a conflicting public.users row lock.
      await authTx.$executeRawUnsafe("SET LOCAL lock_timeout = '1000ms'");
      if (isId)
        await authTx.$executeRaw`UPDATE auth.users SET recovery_token = 'test_recovery' WHERE id = ${idOrEmail}::uuid`;
      else
        await authTx.$executeRaw`UPDATE auth.users SET recovery_token = 'test_recovery' WHERE email = ${idOrEmail}`;
    });
  const makeService = (withAuthTriggers = false) => {
    const service = new StripeService(
      prisma as unknown as PrismaService,
      {
        stripeSecretKey: 'sk_test_placeholder',
        stripeWebhookSecret: webhookSecret,
        frontendUrl: 'https://checkout.example.test',
        get: () => 'price_test',
      } as unknown as AppConfigService,
      {
        adminGetUserByEmail: (email: string) => prisma.users.findUnique({ where: { email } }),
        adminCreateUser: async (
          email: string,
          _password: string,
          name?: string,
          pending = false,
        ) => {
          const id = randomUUID();
          if (withAuthTriggers) {
            await prisma.$executeRaw`INSERT INTO auth.users (id, email, raw_user_meta_data)
              VALUES (${id}::uuid, ${email}, jsonb_build_object('fullName', ${name ?? email}))`;
          } else {
            await prisma.users.create({ data: { id, email, name, role_id: roleId } });
          }
          const user = await prisma.users.findUniqueOrThrow({ where: { id } });
          emailPending.set(user.id, pending);
          return user;
        },
        adminIsPasswordSetupEmailPending: (id: string) =>
          Promise.resolve(emailPending.get(id) ?? false),
        adminSetPasswordSetupEmailPending: async (id: string, pending: boolean) => {
          if (withAuthTriggers) await updateAuthUser(id, true);
          emailPending.set(id, pending);
        },
        adminGenerateRecoveryToken: async (email: string) => {
          if (withAuthTriggers) await updateAuthUser(email, false);
          return { hashedToken: 'test_recovery' };
        },
      } as unknown as SupabaseService,
      cohort,
      { sendSetPasswordEmail: sendEmail } as unknown as EmailService,
    );
    Object.defineProperty(service, 'stripe', {
      value: {
        webhooks: sdk.webhooks,
        refunds: { create: refund, list: () => Promise.resolve({ data: [], has_more: false }) },
        prices: { retrieve: () => Promise.resolve({ unit_amount: 10000, currency: 'usd' }) },
        paymentIntents: {
          create: createIntent,
          retrieve: (id: string) => Promise.resolve({ ...intents.get(id)! }),
          cancel: (id: string) => {
            const intent = intents.get(id)!;
            intent.status = 'canceled';
            return Promise.resolve({ ...intent });
          },
        },
      },
    });
    return service;
  };
  const deliver = (service: StripeService, intent: Intent, eventId = `evt_${intent.id}`) => {
    const payload = JSON.stringify({
      id: eventId,
      type: 'payment_intent.succeeded',
      data: { object: { ...intent, status: 'succeeded' } },
    });
    const signature = sdk.webhooks.generateTestHeaderString({ payload, secret: webhookSecret });
    return service.handleWebhook(
      { rawBody: Buffer.from(payload) } as RawBodyRequest<Request>,
      signature,
    );
  };
  const legacyIntent = (email: string): Intent => ({
    id: `pi_legacy_${email}`,
    client_secret: 'test_secret',
    status: 'succeeded',
    amount: 10000,
    currency: 'usd',
    receipt_email: email,
    metadata: { cohortId },
  });

  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    if (url.hostname !== '127.0.0.1' || url.pathname !== '/checkout_issue4_test') {
      throw new Error(
        'CHECKOUT_TEST_DATABASE_URL must point to the isolated local checkout_issue4_test database',
      );
    }
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    // Rebuild only the guarded disposable database, then exercise the two real
    // checkout migrations against the full current application schema.
    await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS auth CASCADE');
    await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE');
    await prisma.$executeRawUnsafe('CREATE SCHEMA public');
    const schemaSql = execFileSync(
      process.execPath,
      [
        join(process.cwd(), 'node_modules/prisma/build/index.js'),
        'migrate',
        'diff',
        '--from-empty',
        '--to-schema-datamodel',
        'prisma/schema.prisma',
        '--script',
      ],
      { cwd: process.cwd(), encoding: 'utf8' },
    );
    for (const statement of schemaSql.split(';').filter((sql) => sql.trim()))
      await prisma.$executeRawUnsafe(statement);
    await prisma.$executeRawUnsafe('DROP TABLE "checkout_orders"');
    await prisma.$executeRawUnsafe('ALTER TABLE "stripe_events" DROP COLUMN "outcome"');
    for (const migration of [
      '20261008000000_add_checkout_orders',
      '20261008010000_reserve_checkout_seats',
    ]) {
      const sql = readFileSync(
        join(process.cwd(), 'prisma/migrations', migration, 'migration.sql'),
        'utf8',
      );
      for (const statement of sql.split(';').filter((sql) => sql.trim()))
        await prisma.$executeRawUnsafe(statement);
    }
    await prisma.$executeRawUnsafe('CREATE SCHEMA auth');
    await prisma.$executeRawUnsafe(`CREATE TABLE auth.users (
      id UUID PRIMARY KEY, email TEXT UNIQUE NOT NULL,
      raw_user_meta_data JSONB NOT NULL DEFAULT '{}', recovery_token TEXT
    )`);
    const triggerSql = readFileSync(
      join(process.cwd(), 'prisma/manual/supabase_triggers.sql'),
      'utf8',
    );
    const triggerStatements = triggerSql.match(
      /create or replace function[\s\S]*?\$\$[\s\S]*?\$\$;|create or replace trigger[\s\S]*?;/gi,
    );
    if (triggerStatements?.length !== 4) throw new Error('Unexpected Supabase trigger script');
    for (const statement of triggerStatements) await prisma.$executeRawUnsafe(statement);
    await prisma.roles.create({ data: { id: roleId, name: 'student' } });
    await prisma.users.create({
      data: { id: teacherId, email: 'teacher@example.test', role_id: roleId },
    });
    await prisma.users.create({
      data: { id: manualStudentId, email: 'manual@example.test', role_id: roleId },
    });
    await prisma.cohorts.create({
      data: {
        id: cohortId,
        name: 'Test class',
        is_public: true,
        max_students: 2,
        teacher_id: teacherId,
      },
    });
    cohort = new CohortService(prisma as unknown as PrismaService, {} as ZoomMeetingService);
  }, 20000);

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('DELETE FROM auth.users');
    await prisma.checkout_orders.deleteMany();
    await prisma.cohort_students.deleteMany();
    await prisma.stripe_events.deleteMany();
    await prisma.users.deleteMany({ where: { id: { notIn: [teacherId, manualStudentId] } } });
    await prisma.cohorts.update({
      where: { id: cohortId },
      data: {
        max_students: 2,
        total_students: 0,
        is_public: true,
        status: 'active',
        archived_at: null,
      },
    });
    intents.clear();
    byKey.clear();
    emailPending.clear();
    createIntent.mockClear();
    sendEmail.mockClear();
    refund.mockReset();
    refund.mockResolvedValue({ id: 're_database_test', status: 'succeeded' });
  });
  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('creates one order and one Stripe intent for concurrent requests from different instances', async () => {
    const services = [makeService(), makeService()];
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        services[index % 2].createRegistrationPaymentIntent(
          cohortId,
          'student@example.test',
          'Student',
          checkoutId,
        ),
      ),
    );
    expect(await prisma.checkout_orders.count()).toBe(1);
    expect(createIntent).toHaveBeenCalledTimes(1);
    expect(new Set(results.map((result) => result.paymentIntentId)).size).toBe(1);
  });

  it('prevents competing anonymous keys from creating a second payable intent', async () => {
    const services = [makeService(), makeService()];
    const results = await Promise.allSettled([
      services[0].createRegistrationPaymentIntent(
        cohortId,
        'student@example.test',
        'Student',
        checkoutId,
      ),
      services[1].createRegistrationPaymentIntent(
        cohortId,
        'student@example.test',
        'Student',
        otherCheckoutId,
      ),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const failed = results.find((result) => result.status === 'rejected');
    expect(failed?.status === 'rejected' && failed.reason).toBeInstanceOf(ConflictException);
    expect(createIntent).toHaveBeenCalledTimes(1);
  });

  it('allows only one of eight different customers to reserve the last seat', async () => {
    await prisma.cohorts.update({ where: { id: cohortId }, data: { max_students: 1 } });
    const services = [makeService(), makeService()];
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, (_, index) =>
        services[index % 2].createRegistrationPaymentIntent(
          cohortId,
          `student${index}@example.test`,
          'Student',
          randomUUID(),
        ),
      ),
    );
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(await prisma.checkout_orders.count({ where: { seat_reserved: true } })).toBe(1);
    expect(createIntent).toHaveBeenCalledTimes(1);
    expect((await cohort.findAll())[0].available_spots).toBe(0);
  });

  it('converts a reserved last seat into enrollment and handles duplicate webhooks once', async () => {
    await prisma.cohorts.update({ where: { id: cohortId }, data: { max_students: 1 } });
    const service = makeService();
    const payment = await service.createRegistrationPaymentIntent(
      cohortId,
      'student@example.test',
      'Student',
      checkoutId,
    );
    const intent = intents.get(payment.paymentIntentId)!;
    intent.status = 'succeeded';
    await Promise.all([deliver(service, intent), deliver(makeService(), intent)]);
    expect(await prisma.cohort_students.count()).toBe(1);
    expect(await prisma.checkout_orders.count({ where: { seat_reserved: true } })).toBe(0);
    expect(
      (await prisma.cohorts.findUniqueOrThrow({ where: { id: cohortId } })).total_students,
    ).toBe(1);
    expect(await service.getSessionStatus(intent.id)).toEqual({ status: 'completed' });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(refund).not.toHaveBeenCalled();
  });

  it('serializes teacher enrollment against checkout for the last seat', async () => {
    await prisma.cohorts.update({ where: { id: cohortId }, data: { max_students: 1 } });
    const results = await Promise.allSettled([
      makeService().createRegistrationPaymentIntent(
        cohortId,
        'student@example.test',
        'Student',
        checkoutId,
      ),
      cohort.addStudent(cohortId, manualStudentId, teacherId),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(
      (await prisma.cohort_students.count()) +
        (await prisma.checkout_orders.count({ where: { seat_reserved: true } })),
    ).toBe(1);
  });

  it('prevents lowering capacity below reserved seats', async () => {
    await makeService().createRegistrationPaymentIntent(
      cohortId,
      'student@example.test',
      'Student',
      checkoutId,
    );
    await expect(cohort.update(cohortId, { max_students: 0 }, teacherId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect((await prisma.cohorts.findUniqueOrThrow({ where: { id: cohortId } })).max_students).toBe(
      2,
    );
  });

  it('releases an abandoned intent only after cancellation, making its seat available again', async () => {
    await prisma.cohorts.update({ where: { id: cohortId }, data: { max_students: 1 } });
    const service = makeService();
    const payment = await service.createRegistrationPaymentIntent(
      cohortId,
      'student@example.test',
      'Student',
      checkoutId,
    );
    await prisma.checkout_orders.updateMany({ data: { reservation_expires_at: new Date(0) } });
    await service.expireCheckoutReservations();
    expect(intents.get(payment.paymentIntentId)!.status).toBe('canceled');
    await service.createRegistrationPaymentIntent(
      cohortId,
      'other@example.test',
      'Other',
      otherCheckoutId,
    );
    expect(await prisma.checkout_orders.count({ where: { seat_reserved: true } })).toBe(1);
  });

  it('enrolls only one of two concurrent unreserved legacy payments and refunds the other', async () => {
    await prisma.cohorts.update({ where: { id: cohortId }, data: { max_students: 1 } });
    const services = [makeService(), makeService()];
    await Promise.all([
      deliver(services[0], legacyIntent('legacy1@example.test')),
      deliver(services[1], legacyIntent('legacy2@example.test')),
    ]);
    expect(await prisma.cohort_students.count()).toBe(1);
    expect(await prisma.stripe_events.count({ where: { outcome: 'refunded' } })).toBe(1);
    expect(await prisma.stripe_events.count({ where: { outcome: 'completed' } })).toBe(1);
    expect(refund).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('persists a refund decision across a lost API response and never sends a setup email on retry', async () => {
    await prisma.cohorts.update({ where: { id: cohortId }, data: { max_students: 1 } });
    await cohort.addStudent(cohortId, manualStudentId, teacherId);
    const service = makeService();
    const intent = legacyIntent('legacy@example.test');
    refund.mockRejectedValueOnce(new Error('Response lost'));
    await expect(deliver(service, intent)).rejects.toThrow('Response lost');
    expect(await service.getSessionStatus(intent.id)).toEqual({ status: 'pending' });
    await cohort.removeStudent(cohortId, manualStudentId, teacherId);
    await deliver(service, intent);
    expect(refund.mock.calls[0]).toEqual(refund.mock.calls[1]);
    expect(await service.getSessionStatus(intent.id)).toEqual({ status: 'refunded' });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(await prisma.cohort_students.count()).toBe(0);
  });
  it('protects a paid reservation through email failure and expiry until fulfillment succeeds', async () => {
    await prisma.cohorts.update({ where: { id: cohortId }, data: { max_students: 1 } });
    const service = makeService();
    const payment = await service.createRegistrationPaymentIntent(
      cohortId,
      'student@example.test',
      'Student',
      checkoutId,
    );
    const intent = intents.get(payment.paymentIntentId)!;
    intent.status = 'succeeded';
    sendEmail.mockRejectedValueOnce(new Error('Email unavailable'));
    await expect(deliver(service, intent)).rejects.toThrow('Email unavailable');
    expect(await prisma.checkout_orders.count({ where: { seat_reserved: true } })).toBe(1);
    expect(await prisma.cohort_students.count()).toBe(0);
    await prisma.checkout_orders.updateMany({ data: { reservation_expires_at: new Date(0) } });
    await service.expireCheckoutReservations();
    await expect(
      makeService().createRegistrationPaymentIntent(
        cohortId,
        'other@example.test',
        'Other',
        otherCheckoutId,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await deliver(service, intent);
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(await service.getSessionStatus(intent.id)).toEqual({ status: 'completed' });
    expect(await prisma.cohort_students.count()).toBe(1);
    expect(await prisma.checkout_orders.count({ where: { seat_reserved: true } })).toBe(0);
  });
  it('completes payment and sends email when the real auth update trigger synchronizes public users', async () => {
    const service = makeService(true);
    const payment = await service.createRegistrationPaymentIntent(
      cohortId,
      'trigger@example.test',
      'Trigger Student',
      checkoutId,
    );
    const intent = intents.get(payment.paymentIntentId)!;
    intent.status = 'succeeded';
    await deliver(service, intent);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(await service.getSessionStatus(intent.id)).toEqual({ status: 'completed' });
    expect(await prisma.cohort_students.count()).toBe(1);
    expect(await prisma.checkout_orders.count({ where: { seat_reserved: true } })).toBe(0);
    const user = await prisma.users.findUniqueOrThrow({ where: { email: 'trigger@example.test' } });
    expect(emailPending.get(user.id)).toBe(false);
  });
});
