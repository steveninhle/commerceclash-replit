import { ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '@utils/prisma/prisma.service';
import { ReusableService } from '@utils/common/classes/reusable';
import { Server, Socket } from 'socket.io';
import { ClassGateway } from './class.gateway';
import { ClassService } from './class.service';
import { PrototypePerkAccess } from './prototype-perk-access';
import { SkillsService } from '../skills/skills.service';
import { FanTheFlames } from '../gamification/systems/FanTheFlames';

describe('Standalone perk test page gateway', () => {
  let gateway: ClassGateway;
  let client: Socket;
  const emit = jest.fn();
  const broadcast = jest.fn();
  const join = jest.fn();
  const access = { student: jest.fn(), teacher: jest.fn() };
  const service = { triggerApprovedPerkForTest: jest.fn() };
  const reusable = { checkEnrollment: jest.fn() };
  const db = {
    renamedclass: { findUniqueOrThrow: jest.fn() },
    enrolled_students: { findFirst: jest.fn(), update: jest.fn() },
    $executeRaw: jest.fn(),
    $transaction: jest.fn(),
  };
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    gateway = new ClassGateway(
      service as unknown as ClassService,
      reusable as unknown as ReusableService,
      {} as SkillsService,
      db as unknown as PrismaService,
      access as unknown as PrototypePerkAccess,
    );
    gateway.server = { to: jest.fn(() => ({ emit: broadcast })) } as unknown as Server;
    client = { id: 'test-socket', data: {}, emit, join } as unknown as Socket;
    db.renamedclass.findUniqueOrThrow.mockResolvedValue({ instructor_id: 'actual-teacher' });
    db.$transaction.mockImplementation((run: (tx: typeof db) => unknown) => run(db));
  });
  afterEach(() => jest.restoreAllMocks());

  it.each(['student', 'teacher'] as const)(
    'registers a verified %s without joining a meeting',
    async (role) => {
      await gateway.handleJoinPerkTest(client, { classId: 'class', role, studentId: 'student' });
      expect(join).toHaveBeenCalledWith('class');
      expect(client.data.type).toBe(role);
      expect(role === 'teacher' ? client.data.teacherId : client.data.studentId).toBe(
        role === 'teacher' ? 'actual-teacher' : 'student',
      );
      expect(emit).toHaveBeenCalledWith(
        'perk-test-joined',
        expect.objectContaining({ success: true }),
      );
    },
  );
  it.each(['student', 'teacher'] as const)(
    'rejects an unauthorized %s before joining the test room',
    async (role) => {
      access[role].mockRejectedValue(new ForbiddenException('disabled or unauthorized'));
      await gateway.handleJoinPerkTest(client, { classId: 'class', role, studentId: 'student' });
      expect(join).not.toHaveBeenCalled();
      expect(emit).toHaveBeenCalledWith(
        'perk-test-joined',
        expect.objectContaining({ success: false }),
      );
    },
  );
  it('does not report a connection when joining the socket room fails', async () => {
    join.mockRejectedValue(new Error('room unavailable'));
    await gateway.handleJoinPerkTest(client, {
      classId: 'class',
      role: 'student',
      studentId: 'student',
    });
    expect(emit).toHaveBeenCalledWith(
      'perk-test-joined',
      expect.objectContaining({ success: false }),
    );
  });
  it('authorizes simulated events before dispatching an effect', async () => {
    access.student.mockRejectedValue(new ForbiddenException('no session'));
    await gateway.handlePerkTestTrigger(client, {
      classId: 'class',
      studentId: 'student',
      perkKey: 'masterpiece',
    });
    expect(service.triggerApprovedPerkForTest).not.toHaveBeenCalled();
    expect(broadcast).not.toHaveBeenCalled();
  });
  it('opens target selection instead of marking the reactive perk used', async () => {
    service.triggerApprovedPerkForTest.mockResolvedValue({
      success: true,
      message: 'choose',
      data: { perkId: 'perk', pendingCompletion: true, requiresSelection: true, rivals: [] },
    });
    await gateway.handlePerkTestTrigger(client, {
      classId: 'class',
      studentId: 'student',
      perkKey: 'extortion',
    });
    expect(service.triggerApprovedPerkForTest).toHaveBeenCalledWith(
      'class',
      'student',
      'extortion',
      undefined,
    );
    expect(emit).toHaveBeenCalledWith(
      'perk-activated',
      expect.objectContaining({ data: expect.objectContaining({ perk_status: 'approved' }) }),
    );
  });
  it('does not emit an activation when the perk lacks approval', async () => {
    service.triggerApprovedPerkForTest.mockResolvedValue({
      success: false,
      message: 'approval required',
    });
    await gateway.handlePerkTestTrigger(client, {
      classId: 'class',
      studentId: 'student',
      perkKey: 'masterpiece',
    });
    expect(emit).toHaveBeenCalledWith(
      'perk-test-trigger-result',
      expect.objectContaining({ success: false }),
    );
    expect(emit).not.toHaveBeenCalledWith('perk-activated', expect.anything());
  });
  it('requires approval for the passive loss test before changing MS', async () => {
    reusable.checkEnrollment.mockResolvedValue({ enrolledStudent: { id: 'own', market_share: 5 } });
    jest.spyOn(FanTheFlames, 'findAvailable').mockResolvedValue(null);
    await gateway.handlePerkTestMsLoss(client, { classId: 'class', studentId: 'student' });
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith(
      'perk-test-ms-loss-result',
      expect.objectContaining({ success: false }),
    );
  });
  it.each([0, 5])(
    'applies the redirected loss within the target balance (%i)',
    async (market_share) => {
      reusable.checkEnrollment.mockResolvedValue({
        enrolledStudent: { id: 'own', market_share: 5 },
      });
      jest.spyOn(FanTheFlames, 'findAvailable').mockResolvedValue({ studentPerkId: 'perk' });
      jest.spyOn(gateway, 'checkAndOfferFanTheFlames').mockResolvedValue({
        finalTargetEnrollmentId: 'target',
        finalTargetStudentId: 'rival',
        wasRedirected: true,
      });
      db.enrolled_students.findFirst.mockResolvedValue({
        id: 'target',
        student_id: 'rival',
        market_share,
      });
      await gateway.handlePerkTestMsLoss(client, { classId: 'class', studentId: 'student' });
      expect(db.enrolled_students.update).toHaveBeenCalledWith({
        where: { id: 'target' },
        data: { market_share: { decrement: Math.min(1, market_share) } },
      });
      expect(emit).toHaveBeenCalledWith(
        'perk-test-ms-loss-result',
        expect.objectContaining({
          success: true,
          data: { loss: Math.min(1, market_share), targetStudentId: 'rival', wasRedirected: true },
        }),
      );
    },
  );
});
