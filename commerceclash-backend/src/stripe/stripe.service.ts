import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  RawBodyRequest,
} from '@nestjs/common';
import { createDecipheriv, createHash, randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@utils/prisma/prisma.service';
import { AppConfigService } from '@utils/config/config.service';
import { SupabaseService } from '@utils/supabase/supabase.service';
import { CohortService } from 'src/cohort/cohort.service';
import { EmailService } from 'src/email/email.service';
import Stripe from 'stripe';
import { Request } from 'express';
import type { CreatePaymentIntentResponseDto } from './dto/create-checkout.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { assertPublicCheckout, lockCohort, occupiedSeats } from '../cohort/cohort-capacity';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe.Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly supabase: SupabaseService,
    private readonly cohortService: CohortService,
    private readonly emailService: EmailService,
  ) {
    this.stripe = new Stripe(this.config.stripeSecretKey);
  }

  // New purchases use the choose-class checkout and set a password by email.

  async createRegistrationPaymentIntent(
    cohortId: string,
    email: string,
    name: string | undefined,
    checkoutId: string,
  ): Promise<Omit<CreatePaymentIntentResponseDto, 'success'>> {
    const normalizedEmail = email.trim().toLowerCase();
    await this.releaseExpiredReservations(cohortId);
    const keyedOrder = await this.prisma.checkout_orders.findUnique({
      where: { checkout_key: checkoutId },
    });
    if (keyedOrder && (keyedOrder.cohort_id !== cohortId || keyedOrder.email !== normalizedEmail)) {
      throw new BadRequestException('This checkout key belongs to a different checkout');
    }

    let order = await this.prisma.checkout_orders.findUnique({
      where: { cohort_id_email: { cohort_id: cohortId, email: normalizedEmail } },
    });
    if (!order) {
      const snapshot = await this.getCheckoutSnapshot(cohortId, normalizedEmail, name);
      // The unique cohort/email pair also prevents parallel browsers from
      // creating separate payable orders for the same enrollment.
      try {
        order = await this.prisma.checkout_orders.upsert({
          where: { cohort_id_email: { cohort_id: cohortId, email: normalizedEmail } },
          create: {
            cohort_id: cohortId,
            email: normalizedEmail,
            checkout_key: checkoutId,
            ...snapshot,
          },
          update: {},
        });
      } catch (error) {
        // Prisma's empty-update upsert can race on first creation. The unique
        // constraint has already selected the winning order; resume that row.
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
          throw error;
        }
        order = await this.prisma.checkout_orders.findUnique({
          where: { cohort_id_email: { cohort_id: cohortId, email: normalizedEmail } },
        });
        if (!order)
          throw new BadRequestException('This checkout key belongs to a different checkout');
      }
    }
    const orderId = order.id;

    const result = await this.prisma.$transaction(
      async (tx) => {
        const cohort = await lockCohort(tx, cohortId);
        // Serialize across backend instances. Re-read after taking the lock so
        // concurrent requests cannot return or replace different PaymentIntents.
        await tx.$queryRaw`SELECT "id" FROM "checkout_orders" WHERE "id" = ${orderId}::uuid FOR UPDATE`;
        const saved = await tx.checkout_orders.findUniqueOrThrow({ where: { id: orderId } });
        const requestOptions = { timeout: 8000, maxNetworkRetries: 0 };

        if (saved.payment_intent_id) {
          const existing = await this.stripe.paymentIntents.retrieve(
            saved.payment_intent_id,
            {},
            requestOptions,
          );
          if (['processing', 'succeeded', 'requires_capture'].includes(existing.status)) {
            // No secret is exposed to a different browser; an accepted payment
            // only needs enrollment status polling, never another confirmation.
            return this.paymentIntentResponse(existing);
          }
          if (existing.status === 'canceled') {
            // A canceled intent cannot charge. Only then may a fresh attempt
            // replace it, with a new idempotency key and the current price.
            const snapshot = await this.getCheckoutSnapshot(cohortId, normalizedEmail, name);
            await tx.checkout_orders.update({
              where: { id: orderId },
              data: {
                ...snapshot,
                checkout_key: checkoutId,
                payment_intent_id: null,
                attempt: { increment: 1 },
                seat_reserved: false,
                reservation_expires_at: null,
              },
            });
            // Commit the next attempt's immutable parameters before calling
            // Stripe. A lost response must not regenerate different parameters
            // for the same idempotency key on the next request.
            return null;
          } else {
            this.assertCheckoutOwner(saved.checkout_key, checkoutId);
            try {
              assertPublicCheckout(cohort);
            } catch (error) {
              // Commit release only after cancellation. Throwing inside the
              // transaction would roll the reservation change back.
              await this.stripe.paymentIntents.cancel(existing.id, {}, requestOptions);
              await tx.checkout_orders.update({
                where: { id: saved.id },
                data: { seat_reserved: false, reservation_expires_at: null },
              });
              return error as BadRequestException;
            }
            await this.reserveSeat(tx, cohort, saved.id, saved.email, saved.seat_reserved);
            return this.paymentIntentResponse(existing);
          }
        }

        this.assertCheckoutOwner(saved.checkout_key, checkoutId);
        assertPublicCheckout(cohort);
        await this.reserveSeat(tx, cohort, saved.id, saved.email, saved.seat_reserved);
        const paymentIntent = await this.stripe.paymentIntents.create(
          {
            amount: saved.amount,
            currency: saved.currency,
            payment_method_types: ['card'],
            receipt_email: saved.email,
            metadata: {
              checkoutOrderId: saved.id,
              cohortId: saved.cohort_id,
              cohortName: saved.cohort_name,
              ...(saved.customer_name ? { customerName: saved.customer_name } : {}),
            },
          },
          { ...requestOptions, idempotencyKey: `checkout-order:${saved.id}:${saved.attempt}` },
        );

        // Do not expose a client secret until the PaymentIntent ID is durable.
        // Lost HTTP responses can then resume this same intent even after
        // Stripe's idempotency key retention window has elapsed.
        await tx.checkout_orders.update({
          where: { id: saved.id },
          data: { payment_intent_id: paymentIntent.id },
        });
        return this.paymentIntentResponse(paymentIntent);
      },
      { maxWait: 10000, timeout: 30000 },
    );
    if (result instanceof BadRequestException) throw result;
    return (
      result ?? this.createRegistrationPaymentIntent(cohortId, normalizedEmail, name, checkoutId)
    );
  }

  private assertCheckoutOwner(savedKey: string, suppliedKey: string): void {
    if (savedKey !== suppliedKey) {
      throw new ConflictException({
        success: false,
        message:
          'A checkout is already open for this email and class. Continue in the browser where you started it, or contact support.',
      });
    }
  }

  private paymentIntentResponse(intent: {
    id: string;
    client_secret: string | null;
    status: string;
    amount: number;
    currency: string;
  }): Omit<CreatePaymentIntentResponseDto, 'success'> {
    const accepted = ['processing', 'succeeded', 'requires_capture'].includes(intent.status);
    if (!accepted && !intent.client_secret) {
      throw new Error('Stripe returned a PaymentIntent without a client secret');
    }
    return {
      paymentIntentId: intent.id,
      status: intent.status,
      clientSecret: accepted ? null : intent.client_secret,
      amount: intent.amount,
      currency: intent.currency,
    };
  }

  private async getCheckoutSnapshot(cohortId: string, email: string, name: string | undefined) {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
      select: {
        name: true,
        max_students: true,
        is_public: true,
        status: true,
        archived_at: true,
      },
    });
    if (!cohort) throw new NotFoundException('Cohort not found');
    assertPublicCheckout(cohort);
    if (cohort.max_students <= 0) {
      throw new BadRequestException({ success: false, message: 'This cohort is full' });
    }
    const existingUser = await this.prisma.users.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (existingUser && (await this.cohortService.isEnrolled(cohortId, existingUser.id))) {
      throw new ConflictException({
        success: false,
        message: 'This account is already registered for this cohort',
      });
    }
    const { amount, currency } = await this.resolveConfiguredPrice();
    return { amount, currency, cohort_name: cohort.name, customer_name: name?.trim() || null };
  }

  private async reserveSeat(
    tx: Prisma.TransactionClient,
    cohort: { id: string; max_students: number },
    orderId: string,
    email: string,
    alreadyReserved: boolean,
  ) {
    const registered = await tx.cohort_students.findFirst({
      where: { cohort_id: cohort.id, users: { email: { equals: email, mode: 'insensitive' } } },
      select: { id: true },
    });
    if (registered)
      throw new ConflictException('This account is already registered for this cohort');
    if (
      cohort.max_students <= 0 ||
      (await occupiedSeats(tx, cohort.id, orderId)) >= cohort.max_students
    ) {
      throw new BadRequestException('This cohort is full');
    }
    if (!alreadyReserved) {
      await tx.checkout_orders.update({
        where: { id: orderId },
        data: { seat_reserved: true, reservation_expires_at: new Date(Date.now() + 30 * 60_000) },
      });
    }
  }

  @Cron(CronExpression.EVERY_MINUTE, { waitForCompletion: true })
  async expireCheckoutReservations() {
    await this.releaseExpiredReservations();
  }

  private async releaseExpiredReservations(cohortId?: string) {
    const expired = await this.prisma.checkout_orders.findMany({
      where: {
        seat_reserved: true,
        reservation_expires_at: { lte: new Date() },
        ...(cohortId ? { cohort_id: cohortId } : {}),
      },
      select: { id: true, cohort_id: true },
      orderBy: { reservation_expires_at: 'asc' },
      take: 50,
    });
    for (const order of expired) {
      try {
        await this.prisma.$transaction(
          async (tx) => {
            await lockCohort(tx, order.cohort_id);
            const saved = await tx.checkout_orders.findUniqueOrThrow({ where: { id: order.id } });
            if (
              !saved.seat_reserved ||
              !saved.reservation_expires_at ||
              saved.reservation_expires_at > new Date()
            )
              return;
            if (!saved.payment_intent_id) return; // An uncertain Stripe response retains its seat.
            const options = { timeout: 8000, maxNetworkRetries: 0 };
            const intent = await this.stripe.paymentIntents.retrieve(
              saved.payment_intent_id,
              {},
              options,
            );
            if (['processing', 'succeeded', 'requires_capture'].includes(intent.status)) {
              await tx.checkout_orders.update({
                where: { id: saved.id },
                data: { reservation_expires_at: null },
              });
              return;
            }
            if (intent.status !== 'canceled') {
              await this.stripe.paymentIntents.cancel(
                intent.id,
                { cancellation_reason: 'abandoned' },
                options,
              );
            }
            await tx.checkout_orders.update({
              where: { id: saved.id },
              data: { seat_reserved: false, reservation_expires_at: null },
            });
          },
          { maxWait: 10000, timeout: 30000 },
        );
      } catch (error) {
        // Cancellation may lose a race to confirmation or fail over the network.
        // Keep counting the seat and retry on the next sweep.
        this.logger.warn(
          `Could not release checkout reservation ${order.id}: ${(error as Error).message}`,
        );
      }
    }
  }

  // ─── Price lookup (no email/cohort needed) ──────────────────────────────────
  // Lets checkout show a real Subtotal/Total before the user has typed
  // anything — same STRIPE_PRICE_ID that createRegistrationPaymentIntent
  // resolves at submit time, just without creating a PaymentIntent for it.
  async getPrice(): Promise<{ amount: number; currency: string }> {
    return this.resolveConfiguredPrice();
  }

  // Shared by getPrice and createRegistrationPaymentIntent — both need the
  // same STRIPE_PRICE_ID resolved to a concrete amount/currency.
  private async resolveConfiguredPrice(): Promise<{ amount: number; currency: string }> {
    const price = await this.stripe.prices.retrieve(this.config.get<string>('STRIPE_PRICE_ID'));
    if (price.unit_amount == null) {
      throw new BadRequestException({
        success: false,
        message: 'Stripe price is not configured with a fixed amount',
      });
    }
    return { amount: price.unit_amount, currency: price.currency };
  }

  // ─── Fast duplicate-email check (no Stripe call) ────────────────────────────
  // Let checkout show duplicate enrollment feedback before creating a PaymentIntent.
  async checkEmailAvailability(
    cohortId: string,
    email: string,
  ): Promise<{ available: boolean; message?: string }> {
    const normalizedEmail = email.trim();
    if (!cohortId || !normalizedEmail) return { available: true };

    const existingUser = await this.prisma.users.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });
    if (!existingUser) return { available: true };

    const alreadyEnrolled = await this.cohortService.isEnrolled(cohortId, existingUser.id);
    if (!alreadyEnrolled) return { available: true };

    return {
      available: false,
      message: 'This account is already registered for this cohort',
    };
  }

  // ─── Poll endpoint: did the webhook finish processing this session? ─────────
  // Reused for both flows — `sessionId` here is either a Checkout Session id
  // or a PaymentIntent id, since both are stored in stripe_events.session_id.

  async getSessionStatus(
    sessionId: string,
  ): Promise<{ status: 'pending' | 'completed' | 'refunded' }> {
    const record = await this.prisma.stripe_events.findFirst({
      where: { session_id: sessionId },
    });
    return {
      status:
        !record || record.outcome === 'refund_pending'
          ? 'pending'
          : record.outcome === 'refunded'
            ? 'refunded'
            : 'completed',
    };
  }

  // ─── Stripe webhook — SOURCE OF TRUTH ──────────────────────────────────────

  async handleWebhook(req: RawBodyRequest<Request>, signature: string): Promise<void> {
    let event: ReturnType<typeof this.stripe.webhooks.constructEvent>;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody!,
        signature,
        this.config.stripeWebhookSecret,
      );
    } catch (err) {
      this.logger.warn(`Stripe signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException('Invalid Stripe signature');
    }

    if (event.type !== 'checkout.session.completed' && event.type !== 'payment_intent.succeeded') {
      return;
    }

    // Idempotency: skip if already processed
    const existing = await this.prisma.stripe_events.findUnique({
      where: { stripe_event_id: event.id },
    });
    if (existing && existing.outcome !== 'refund_pending') {
      this.logger.log(`Stripe event ${event.id} already processed, skipping`);
      return;
    }

    let identifierId: string;
    let customerEmail: string;
    let customerName: string | undefined;
    let cohortId: string;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.payment_status !== 'paid') return;
      identifierId = session.id;
      customerEmail = (session.customer_details?.email ?? '').trim().toLowerCase();
      customerName = session.customer_details?.name ?? undefined;
      cohortId = ((session.metadata ?? {}) as Record<string, string>).cohortId ?? '';
    } else {
      const paymentIntent = event.data.object;
      identifierId = paymentIntent.id;
      customerEmail = (paymentIntent.receipt_email ?? '').trim().toLowerCase();
      customerName = (paymentIntent.metadata ?? {}).customerName ?? undefined;
      cohortId = ((paymentIntent.metadata ?? {}) as Record<string, string>).cohortId ?? '';
    }

    if (!cohortId) {
      this.logger.error(`Missing cohortId in event ${identifierId}`);
      return;
    }

    await this.fulfillRegistration(identifierId, cohortId, customerEmail, customerName, event);
  }

  // ─── Shared fulfillment: find-or-create user, sync password, enroll ────────
  // Called by handleWebhook for either checkout.session.completed (hosted
  // Checkout) or payment_intent.succeeded (embedded PaymentElement) — the two
  // flows converge here since account/enrollment creation is identical once
  // we know identifierId/cohortId/email. `identifierId` is a Checkout Session
  // id or a PaymentIntent id (both stored as stripe_events.session_id /
  // pending_registrations.session_id — same column, either kind of id).

  private async fulfillRegistration(
    identifierId: string,
    cohortId: string,
    customerEmail: string,
    customerName: string | undefined,
    event: ReturnType<typeof this.stripe.webhooks.constructEvent>,
  ): Promise<void> {
    const sessionId = identifierId;

    const fulfilled = await this.prisma.$transaction(
      async (tx) => {
        const cohort = await lockCohort(tx, cohortId);
        const processed = await tx.stripe_events.findFirst({ where: { session_id: sessionId } });
        if (processed)
          return processed.outcome === 'refunded'
            ? 'refunded'
            : processed.outcome !== 'refund_pending';
        // Compatibility for payments started before password collection was retired.
        // New PaymentIntents never create pending registrations.
        const pendingReg = await tx.pending_registrations.findUnique({
          where: { session_id: sessionId },
        });
        // Resolve password + authoritative email from pending registration
        let credentialsPassword: string | undefined;
        const isValidPending = !!(pendingReg && new Date() < pendingReg.expires_at);
        if (isValidPending) {
          credentialsPassword = this.decrypt(pendingReg.encrypted_password);
        }

        // Use registration email as authoritative source (prevents mismatch if user changes email in Stripe form)
        const effectiveEmail = (isValidPending ? pendingReg.email : customerEmail)
          .trim()
          .toLowerCase();

        if (!effectiveEmail) {
          throw new Error(`No email available to fulfill registration for ${sessionId}`);
        }

        const order = await tx.checkout_orders.findUnique({
          where: { payment_intent_id: sessionId },
        });
        if (order && (order.cohort_id !== cohortId || order.email !== effectiveEmail)) {
          throw new Error('Payment does not match its checkout order');
        }
        if (order?.fulfilled_at) {
          await tx.stripe_events.create({
            data: {
              stripe_event_id: event.id,
              session_id: sessionId,
              event_type: event.type,
              payload: event as unknown as Prisma.InputJsonObject,
            },
          });
          return true;
        }
        const enrolled = await tx.cohort_students.findFirst({
          where: {
            cohort_id: cohortId,
            users: { email: { equals: effectiveEmail, mode: 'insensitive' } },
          },
          select: { id: true },
        });
        // Honor seats reserved while the class was public, even if it is hidden
        // later. Unreserved old payments must pass current eligibility/capacity.
        if (
          (!order?.seat_reserved &&
            (!cohort.is_public || cohort.status !== 'active' || cohort.archived_at)) ||
          (order && enrolled) ||
          (!enrolled &&
            (cohort.max_students <= 0 ||
              (await occupiedSeats(tx, cohortId, order?.id)) >= cohort.max_students))
        ) {
          await tx.stripe_events.create({
            data: {
              stripe_event_id: event.id,
              session_id: sessionId,
              event_type: event.type,
              outcome: 'refund_pending',
              payload: event as unknown as Prisma.InputJsonObject,
            },
          });
          return false;
        }

        // ── 1. Find or create user ────────────────────────────────────────────────
        const localUser = await tx.users.findFirst({
          where: { email: { equals: effectiveEmail, mode: 'insensitive' } },
        });

        let passwordSetupEmailPending = false;
        let userToProvision: { id: string; roleId: string } | undefined;

        if (!localUser) {
          let existingAuthUser = await this.supabase.adminGetUserByEmail(effectiveEmail);

          if (!existingAuthUser) {
            try {
              // Persist the pending-email flag with account creation, before the
              // auth.users trigger can make this account appear in the local DB.
              existingAuthUser = await this.supabase.adminCreateUser(
                effectiveEmail,
                credentialsPassword ?? this.generatePassword(),
                customerName,
                !credentialsPassword,
              );
              passwordSetupEmailPending = !credentialsPassword;
            } catch (createErr: unknown) {
              const msg = createErr instanceof Error ? createErr.message : String(createErr);
              if (!msg.includes('already registered') && !msg.includes('already been registered')) {
                throw createErr;
              }
              existingAuthUser = await this.supabase.adminGetUserByEmail(effectiveEmail);
              if (!existingAuthUser) {
                throw new Error(
                  `Cannot find Supabase user after "already registered" error: ${effectiveEmail}`,
                );
              }
              if (credentialsPassword) {
                await this.supabase.adminUpdateUserPassword(
                  existingAuthUser.id,
                  credentialsPassword,
                );
              } else {
                await this.supabase.adminSetPasswordSetupEmailPending(existingAuthUser.id, true);
                passwordSetupEmailPending = true;
              }
            }
          } else if (credentialsPassword) {
            // Preserve password synchronization for payments started in the old flow.
            await this.supabase.adminUpdateUserPassword(existingAuthUser.id, credentialsPassword);
          } else {
            // An auth-only account may be left behind by an earlier checkout attempt.
            await this.supabase.adminSetPasswordSetupEmailPending(existingAuthUser.id, true);
            passwordSetupEmailPending = true;
          }

          const supabaseUserId = existingAuthUser.id;
          const studentRole = await tx.roles.findFirst({ where: { name: 'student' } });
          if (!studentRole) throw new Error('Student role not found in DB');

          // Supabase writes auth.users while generating the recovery token and
          // acknowledging email delivery. Its update trigger writes public.users.
          // Defer our user-row write until those operations finish so neither
          // connection waits on a row lock held by the other.
          userToProvision = { id: supabaseUserId, roleId: studentRole.id };
        } else if (credentialsPassword) {
          // Local DB user exists — still sync Supabase password for legacy payments.
          await this.supabase.adminUpdateUserPassword(localUser.id, credentialsPassword);
        } else {
          passwordSetupEmailPending = await this.supabase.adminIsPasswordSetupEmailPending(
            localUser.id,
          );
        }

        const studentId = localUser?.id ?? userToProvision?.id;
        if (!studentId) throw new Error('No student account available for enrollment');

        if (passwordSetupEmailPending) {
          const { hashedToken } = await this.supabase.adminGenerateRecoveryToken(effectiveEmail);
          const link = `${this.config.frontendUrl}/set-password?token=${hashedToken}&type=recovery`;
          await this.emailService.sendSetPasswordEmail(
            effectiveEmail,
            link,
            customerName ?? localUser?.name ?? undefined,
          );
          await this.supabase.adminSetPasswordSetupEmailPending(studentId, false);
        }

        if (userToProvision) {
          await tx.users.upsert({
            where: { id: studentId },
            create: {
              id: studentId,
              email: effectiveEmail,
              name: customerName ?? null,
              role_id: userToProvision.roleId,
              is_active: true,
            },
            update: { role_id: userToProvision.roleId, is_active: true },
          });
        }

        // ── 2. Enroll + mark event completed (atomic) ─────────────────────────────
        const alreadyEnrolled = await tx.cohort_students.findUnique({
          where: { cohort_id_student_id: { cohort_id: cohortId, student_id: studentId } },
        });

        await tx.cohort_students.upsert({
          where: { cohort_id_student_id: { cohort_id: cohortId, student_id: studentId } },
          create: { cohort_id: cohortId, student_id: studentId, is_new: true },
          update: {},
        });

        // The cohort lock serializes checkout, manual enrollment, and webhook
        // writers. Count actual memberships so retries never double-count.
        const totalStudents = await tx.cohort_students.count({ where: { cohort_id: cohortId } });
        await tx.cohorts.update({
          where: { id: cohortId },
          data: { total_students: totalStudents },
        });

        if (!alreadyEnrolled) {
          // Back-fill per-class enrollment: cohort_students alone doesn't make the
          // student show up in any class — the student dashboard reads enrolled_students.
          const cohortClasses = await tx.renamedclass.findMany({
            where: { cohort_id: cohortId },
            select: { id: true },
          });
          if (cohortClasses.length > 0) {
            await tx.enrolled_students.createMany({
              data: cohortClasses.map((c) => ({ student_id: studentId, class_id: c.id })),
              skipDuplicates: true,
            });

            // Same gap as the manual enroll endpoints: an enrollment with no
            // student_attributes rows renders every skill cell permanently
            // disabled for this student in the teacher's manage-class table,
            // regardless of skill_unlocked. `alreadyEnrolled` above guarantees
            // these are brand-new enrollments, but attribute rows are queried
            // per-enrollment (not blindly created) in case a webhook retry
            // already ran this block.
            const newEnrollments = await tx.enrolled_students.findMany({
              where: { student_id: studentId, class_id: { in: cohortClasses.map((c) => c.id) } },
              select: { id: true },
            });
            const existingAttrCounts = await tx.student_attributes.groupBy({
              by: ['enrollment_id'],
              where: { enrollment_id: { in: newEnrollments.map((e) => e.id) } },
            });
            const alreadyHasAttrs = new Set(existingAttrCounts.map((c) => c.enrollment_id));
            const needsAttrs = newEnrollments
              .map((e) => e.id)
              .filter((id) => !alreadyHasAttrs.has(id));

            if (needsAttrs.length > 0) {
              const allAttributes = await tx.attributes.findMany({
                select: { id: true, value: true },
              });
              if (allAttributes.length > 0) {
                await tx.student_attributes.createMany({
                  data: needsAttrs.flatMap((enrollmentId) =>
                    allAttributes.map((attr) => ({
                      enrollment_id: enrollmentId,
                      attribute_id: attr.id,
                      value: attr.value ?? 0,
                    })),
                  ),
                });
              }
            }
          }
        }

        if (order) {
          await tx.checkout_orders.update({
            where: { id: order.id },
            data: { seat_reserved: false, reservation_expires_at: null, fulfilled_at: new Date() },
          });
        }

        await tx.stripe_events.create({
          data: {
            stripe_event_id: event.id,
            session_id: sessionId,
            event_type: event.type,
            payload: event as unknown as Prisma.InputJsonObject,
          },
        });

        return true;
      },
      { maxWait: 10000, timeout: 60000 },
    );
    if (fulfilled === 'refunded') return;
    if (!fulfilled) {
      await this.refundUnavailableEnrollment(sessionId, cohortId, event);
      return;
    }

    const pendingReg = await this.prisma.pending_registrations.findUnique({
      where: { session_id: sessionId },
    });
    // ── 3. Clean up pending registration ─────────────────────────────────────
    if (pendingReg) {
      await this.prisma.pending_registrations
        .delete({ where: { session_id: sessionId } })
        .catch(() => {});
    }

    this.logger.log(`Enrollment complete for ${customerEmail} → cohort ${cohortId}`);
  }

  private async refundUnavailableEnrollment(
    sessionId: string,
    cohortId: string,
    event: ReturnType<typeof this.stripe.webhooks.constructEvent>,
  ) {
    const paymentIntent =
      event.type === 'payment_intent.succeeded'
        ? sessionId
        : event.type === 'checkout.session.completed'
          ? event.data.object.payment_intent
          : null;
    const paymentIntentId = typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id;
    if (!paymentIntentId)
      throw new Error('Cannot refund unavailable enrollment: missing PaymentIntent');
    // Reconcile an accepted refund after a lost response, including retries
    // beyond Stripe's idempotency retention window.
    const options = { timeout: 8000, maxNetworkRetries: 0 };
    const refunds = await this.stripe.refunds.list(
      { payment_intent: paymentIntentId, limit: 100 },
      options,
    );
    const existingRefund = refunds.data.find(
      (refund) => refund.metadata?.unavailableEnrollment === paymentIntentId,
    );
    if (!existingRefund && refunds.has_more)
      throw new Error('Cannot safely reconcile enrollment refund');
    const refund =
      existingRefund ??
      (await this.stripe.refunds.create(
        { payment_intent: paymentIntentId, metadata: { unavailableEnrollment: paymentIntentId } },
        {
          idempotencyKey: `unavailable-enrollment:${paymentIntentId}`,
          timeout: 8000,
          maxNetworkRetries: 0,
        },
      ));
    if (refund.status !== 'pending' && refund.status !== 'succeeded') {
      throw new Error(`Enrollment refund ${refund.id} needs attention: ${refund.status}`);
    }
    await this.prisma.$transaction(async (tx) => {
      await lockCohort(tx, cohortId);
      await tx.checkout_orders.updateMany({
        where: { payment_intent_id: sessionId },
        data: { seat_reserved: false, reservation_expires_at: null },
      });
      await tx.stripe_events.upsert({
        where: { stripe_event_id: event.id },
        update: { outcome: 'refunded' },
        create: {
          stripe_event_id: event.id,
          session_id: sessionId,
          event_type: event.type,
          outcome: 'refunded',
          payload: event as unknown as Prisma.InputJsonObject,
        },
      });
      await tx.stripe_events.updateMany({
        where: { session_id: sessionId, outcome: 'refund_pending' },
        data: { outcome: 'refunded' },
      });
    });
    this.logger.warn(
      `Refund requested for unavailable enrollment ${sessionId} → cohort ${cohortId}`,
    );
  }

  // ─── Encryption helpers (AES-256-CBC, key derived from webhook secret) ───────

  private deriveKey(): Buffer {
    return createHash('sha256').update(this.config.stripeWebhookSecret).digest();
  }

  private decrypt(ciphertext: string): string {
    const [ivHex, encHex] = ciphertext.split(':');
    const decipher = createDecipheriv('aes-256-cbc', this.deriveKey(), Buffer.from(ivHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString(
      'utf8',
    );
  }

  // Throwaway password for accounts created with no user-supplied password
  // (embedded checkout) — nobody needs to know it, since a recovery email is
  // sent right after so the student can set their own via /set-password.
  private generatePassword(): string {
    return randomBytes(18).toString('base64url');
  }
}
