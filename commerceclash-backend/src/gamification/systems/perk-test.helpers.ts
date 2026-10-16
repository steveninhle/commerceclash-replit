import { Logger } from '@nestjs/common';
import { PrismaService } from '@utils/prisma/prisma.service';
import { ClassGateway } from 'src/class/class.gateway';
import { IPerkEffectContext } from '../core/interfaces/IPerkEffect';
export const skill = (id: string, value: number) => ({ id, value, attributes: { name: id } });
export const context = (additionalData?: Record<string, unknown>): IPerkEffectContext => ({
  classId: 'class',
  student: { id: 'student', name: 'Student', enrollmentId: 'own' },
  perk: { id: 'perk', title: 'Test perk' },
  additionalData,
});

// Exercise the real lifecycle helper and transaction callbacks without a database.
export function fixture(key = 'afterburner', repeatable = true) {
  const perk = {
    id: 'perk',
    enrollment_id: 'own',
    is_unlocked: true,
    is_approved: true,
    is_used: false,
    perk_status: 'approved',
    perks: { key, is_repeatable: repeatable, archtype_id: 'ceo', perk_types: { type: 'core' } },
    enrolled_students: {
      level: 5,
      student_id: 'student',
      class_id: 'class',
      archtype_id: 'ceo',
      is_cancelled: false,
    },
  };
  const rival = {
    id: 'rival-enrollment',
    student_id: 'rival',
    market_share: 3,
    users: { name: 'Rival' },
    archtypes: { title: 'CEO' },
    student_attributes: [skill('rival-skill', 3)],
  };
  const db = {
    student_perks: {
      findUnique: jest.fn().mockResolvedValue(perk),
      findFirst: jest.fn().mockResolvedValue(perk),
      update: jest.fn().mockResolvedValue({}),
    },
    student_attributes: {
      findMany: jest.fn().mockResolvedValue([skill('strong', 6), skill('weak', 2)]),
      update: jest.fn().mockResolvedValue({ value: 7 }),
    },
    enrolled_students: {
      findMany: jest.fn().mockResolvedValue([rival]),
      findUnique: jest.fn().mockResolvedValue({ ...rival, available_points: 2 }),
      update: jest.fn().mockResolvedValue({ available_points: 3 }),
    },
    perk_usage: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    },
    $executeRaw: jest.fn().mockResolvedValue(1),
    $transaction: jest.fn(),
  };
  db.$transaction.mockImplementation((run: (tx: typeof db) => unknown) => run(db));
  const gateway = {
    checkAndOfferFanTheFlames: jest.fn().mockResolvedValue({
      finalTargetEnrollmentId: rival.id,
      wasRedirected: false,
    }),
  };
  return {
    db,
    prisma: db as unknown as PrismaService,
    perk,
    rival,
    gateway,
    classGateway: gateway as unknown as ClassGateway,
  };
}

export function setupPerkTests() {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });
}
