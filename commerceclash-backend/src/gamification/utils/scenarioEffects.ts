import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@utils/prisma/prisma.service';
import { IPerkEffectContext } from '../core/interfaces/IPerkEffect';

export type SkillDelta = { skillId: string; amount: number; skillName?: string };
type Database = Prisma.TransactionClient;

export async function lockScenario(tx: Database, classId: string) {
  await tx.$executeRaw`SELECT id FROM class WHERE id = ${classId}::uuid FOR UPDATE`;
}

export function readDeltas(value: unknown): SkillDelta[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item: unknown): item is SkillDelta =>
      typeof item === 'object' &&
      item !== null &&
      'skillId' in item &&
      typeof item.skillId === 'string' &&
      'amount' in item &&
      typeof item.amount === 'number' &&
      Number.isInteger(item.amount) &&
      item.amount > 0,
  );
}

export async function scenarioUsages(tx: Database, classId: string) {
  return tx.perk_usage.findMany({
    where: {
      enrolled_students: { class_id: classId },
      student_perks: { perks: { key: { in: ['afterburner', 'extortion'] } } },
    },
  });
}

export async function temporaryModifiers(tx: Database, classId: string) {
  const modifiers = new Map<string, number>();
  for (const usage of await scenarioUsages(tx, classId)) {
    const data = usage.result_data as Record<string, unknown> | null;
    if (!data?.active || data.accounting !== 'modifier') continue;
    for (const [key, sign] of [
      ['increments', 1],
      ['deductions', -1],
    ] as const) {
      for (const delta of readDeltas(data[key])) {
        modifiers.set(delta.skillId, (modifiers.get(delta.skillId) ?? 0) + sign * delta.amount);
      }
    }
  }
  return modifiers;
}

export function effectiveSkillValue(value: number, modifier: number) {
  return Math.max(0, Math.min(8, value + modifier));
}

export async function assertScenarioPerk(tx: Database, ctx: IPerkEffectContext, key: string) {
  const perk = await tx.student_perks.findUnique({
    where: { id: ctx.perk.id },
    include: { perks: true, enrolled_students: true },
  });
  if (
    !perk ||
    perk.enrollment_id !== ctx.student.enrollmentId ||
    perk.enrolled_students.student_id !== ctx.student.id ||
    perk.enrolled_students.class_id !== ctx.classId ||
    perk.enrolled_students.archtype_id !== perk.perks.archtype_id ||
    perk.enrolled_students.is_cancelled ||
    !perk.is_unlocked ||
    perk.perks.key !== key
  ) {
    throw new BadRequestException('This perk does not belong to the student.');
  }
  if (
    perk.is_used &&
    (!perk.perks.is_repeatable || !perk.next_available_at || perk.next_available_at > new Date())
  ) {
    throw new BadRequestException('This perk is currently unavailable.');
  }
  if (!perk.is_approved) throw new BadRequestException('Teacher approval is required.');
  return perk;
}

export async function recordScenarioPerk(
  tx: Database,
  ctx: IPerkEffectContext,
  repeatable: boolean,
  data: Prisma.InputJsonObject,
) {
  await tx.student_perks.update({
    where: { id: ctx.perk.id },
    data: {
      is_used: true,
      is_approved: false,
      perk_status: null,
      last_used_at: new Date(),
      next_available_at: repeatable ? new Date(Date.now() + 120_000) : null,
    },
  });
  await tx.perk_usage.create({
    data: {
      student_perk_id: ctx.perk.id,
      enrollment_id: ctx.student.enrollmentId,
      used_at: new Date(),
      result_data: data,
    },
  });
}

export async function endScenarioEffects(prisma: PrismaService, classId: string) {
  return prisma.$transaction(async (tx) => {
    await lockScenario(tx, classId);
    const affectedStudentIds = new Set<string>();
    let revertedEffects = 0;
    for (const usage of await scenarioUsages(tx, classId)) {
      const data = usage.result_data as Record<string, unknown> | null;
      if (data?.pendingCompletion === true) {
        await tx.perk_usage.update({
          where: { id: usage.id },
          data: {
            result_data: { ...data, pendingCompletion: false } as Prisma.InputJsonObject,
          },
        });
      }
      if (data?.active !== true || data.temporaryScenarioEffect !== true) continue;
      // Older prototype records changed the stored value. Retire those once;
      // all new effects only change modifiers and never touch permanent points.
      if (data.accounting !== 'modifier') {
        for (const [key, sign] of [
          ['increments', -1],
          ['deductions', 1],
        ] as const) {
          for (const delta of readDeltas(data[key])) {
            const enrollmentId =
              key === 'increments' ? usage.enrollment_id : data.targetEnrollmentId;
            if (typeof enrollmentId !== 'string') continue;
            const skill = await tx.student_attributes.findFirst({
              where: { id: delta.skillId, enrollment_id: enrollmentId },
            });
            if (skill)
              await tx.student_attributes.update({
                where: { id: skill.id },
                data: { value: effectiveSkillValue(skill.value, sign * delta.amount) },
              });
          }
        }
      }
      await tx.perk_usage.update({
        where: { id: usage.id },
        data: {
          result_data: {
            ...data,
            active: false,
            revertedAt: new Date().toISOString(),
          } as Prisma.InputJsonObject,
        },
      });
      if (Array.isArray(data.affectedStudentIds)) {
        data.affectedStudentIds.forEach((id) => {
          if (typeof id === 'string') affectedStudentIds.add(id);
        });
      }
      revertedEffects++;
    }
    await tx.student_perks.updateMany({
      where: {
        enrolled_students: { class_id: classId },
        perks: { key: 'extortion' },
        is_used: false,
        perk_status: 'approved',
      },
      data: { perk_status: null, is_approved: false },
    });
    return {
      success: true,
      message: `Scenario ended; cleared ${revertedEffects} temporary perk effect(s).`,
      data: { revertedEffects, affectedStudentIds: [...affectedStudentIds] },
    };
  });
}
