import { PrismaService } from '@utils/prisma/prisma.service';
import { requiredPerkLevel } from './reactivePerkKeys';

/** Reserves a teacher-approved reactive perk when its gameplay event occurs. */
export async function provisionStudentPerk(
  prisma: PrismaService,
  enrollmentId: string,
  perkKey: string,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT id FROM enrolled_students WHERE id = ${enrollmentId}::uuid FOR UPDATE`;
    const [template, enrollment] = await Promise.all([
      tx.perks.findUnique({ where: { key: perkKey }, include: { perk_types: true } }),
      tx.enrolled_students.findUnique({ where: { id: enrollmentId } }),
    ]);
    if (!template) return { status: 'perk_not_found' as const };
    if (!enrollment || enrollment.is_cancelled || enrollment.archtype_id !== template.archtype_id) {
      return { status: 'archetype_mismatch' as const };
    }
    const existing = await tx.student_perks.findFirst({
      where: { enrollment_id: enrollmentId, perk_id: template.id },
    });
    if (!existing) return { status: 'archetype_mismatch' as const };
    if (
      !existing.is_unlocked ||
      (enrollment.level ?? 1) < requiredPerkLevel(template.perk_types.type) ||
      !existing.is_approved ||
      existing.perk_status !== 'approved' ||
      (existing.is_used &&
        (!template.is_repeatable ||
          !existing.next_available_at ||
          existing.next_available_at > new Date()))
    ) {
      return { status: 'unavailable' as const, studentPerk: existing };
    }
    const latest = await tx.perk_usage.findFirst({
      where: { student_perk_id: existing.id },
      orderBy: { used_at: 'desc' },
    });
    if ((latest?.result_data as Record<string, unknown> | null)?.pendingCompletion === true) {
      return { status: 'unavailable' as const, studentPerk: existing };
    }
    const reserved = await tx.student_perks.update({
      where: { id: existing.id },
      data: { perk_status: 'pending' },
    });
    return { status: 'ready' as const, studentPerk: reserved };
  });
}
