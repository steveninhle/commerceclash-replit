import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

// All seat allocation paths take this lock before checking capacity. Expired
// reservations still count until Stripe confirms their intent cannot charge.
export async function lockCohort(tx: Prisma.TransactionClient, cohortId: string) {
  await tx.$queryRaw`SELECT "id" FROM "cohorts" WHERE "id" = ${cohortId}::uuid FOR UPDATE`;
  const cohort = await tx.cohorts.findUnique({
    where: { id: cohortId },
    select: {
      id: true,
      name: true,
      teacher_id: true,
      max_students: true,
      is_public: true,
      status: true,
      archived_at: true,
    },
  });
  if (!cohort) throw new NotFoundException('Cohort not found');
  return cohort;
}

export async function occupiedSeats(
  tx: Prisma.TransactionClient,
  cohortId: string,
  orderId?: string,
) {
  const [enrolled, reserved] = await Promise.all([
    tx.cohort_students.count({ where: { cohort_id: cohortId } }),
    tx.checkout_orders.count({
      where: {
        cohort_id: cohortId,
        seat_reserved: true,
        ...(orderId ? { id: { not: orderId } } : {}),
      },
    }),
  ]);
  return enrolled + reserved;
}

export function assertPublicCheckout(cohort: {
  is_public: boolean;
  status: string;
  archived_at: Date | null;
}) {
  if (!cohort.is_public || cohort.status !== 'active' || cohort.archived_at) {
    throw new BadRequestException('This class is not available for public checkout');
  }
}
