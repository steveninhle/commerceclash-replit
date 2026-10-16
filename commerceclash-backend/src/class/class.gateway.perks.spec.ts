import { ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '@utils/prisma/prisma.service';
import { ReusableService } from '@utils/common/classes/reusable';
import { Server, Socket } from 'socket.io';
import { ClassGateway } from './class.gateway';
import { ClassService } from './class.service';
import { PrototypePerkAccess } from './prototype-perk-access';
import { SkillsService } from '../skills/skills.service';

describe('Prototype perk gateway', () => {
  const service = {
    triggerSpotlightForEliteScore: jest.fn(),
    triggerStarPowerForEliteScore: jest.fn(),
    triggerProphecyPrediction: jest.fn(),
    triggerCrystalBallReveal: jest.fn(),
    triggerInsiderTradingReveal: jest.fn(),
    triggerExtortionForScenarioStart: jest.fn(),
    triggerRebirthForScenarioReveal: jest.fn(),
    endHardcodedScenario: jest.fn(),
  };
  const access = { student: jest.fn(), teacher: jest.fn() };
  const broadcast = jest.fn();
  const emit = jest.fn();
  let gateway: ClassGateway;
  let client: Socket;
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    gateway = new ClassGateway(
      service as unknown as ClassService,
      {} as ReusableService,
      {} as SkillsService,
      {} as PrismaService,
      access as unknown as PrototypePerkAccess,
    );
    gateway.server = { to: jest.fn(() => ({ emit: broadcast })) } as unknown as Server;
    client = {
      data: { type: 'student', studentId: 'student' },
      emit,
    } as unknown as Socket;
  });
  afterEach(() => jest.restoreAllMocks());

  it.each(['score', 'prediction', 'invest', 'start', 'reveal', 'end'])(
    'rejects unauthorized %s before any perk effect runs',
    async (event) => {
      access.student.mockRejectedValue(new ForbiddenException('denied'));
      access.teacher.mockRejectedValue(new ForbiddenException('denied'));
      const dto = {
        classId: 'class',
        studentId: 'student',
        score: 'elite',
        predictedType: 'market',
      };
      switch (event) {
        case 'score':
          await gateway.handleTaskScoreSubmitted(client, dto);
          break;
        case 'prediction':
          await gateway.handleScenarioPredictionSubmitted(client, dto);
          break;
        case 'invest':
          await gateway.handleInvestPhaseStarted(client, dto);
          break;
        case 'start':
          await gateway.handleScenarioStarted(client, dto);
          break;
        case 'reveal':
          await gateway.handleScenarioRevealed(client, dto);
          break;
        case 'end':
          await gateway.handleScenarioEnded(client, dto);
          break;
      }
      for (const method of Object.values(service)) expect(method).not.toHaveBeenCalled();
      expect(broadcast).not.toHaveBeenCalled();
      expect(emit).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ success: false }),
      );
    },
  );
  it('broadcasts cleanup only after instructor authorization and successful commit', async () => {
    access.teacher.mockResolvedValue(undefined);
    const result = { success: true, message: 'ended', data: { revertedEffects: 1 } };
    service.endHardcodedScenario.mockResolvedValue(result);
    await gateway.handleScenarioEnded(client, { classId: 'class' });
    expect(access.teacher).toHaveBeenCalledWith(client, 'class');
    expect(broadcast).toHaveBeenCalledWith('scenario-temporary-effects-ended', result);
  });
  it('does not broadcast cleanup when its transaction fails', async () => {
    access.teacher.mockResolvedValue(undefined);
    service.endHardcodedScenario.mockRejectedValue(new Error('transaction failed'));
    await gateway.handleScenarioEnded(client, { classId: 'class' });
    expect(broadcast).not.toHaveBeenCalled();
  });
});

describe('New perk approval gateway', () => {
  const access = { student: jest.fn(), teacher: jest.fn() };
  const service = { activateStudentPerk: jest.fn(), decideNewPerk: jest.fn() };
  const reusable = { checkEnrollment: jest.fn(), checkPerk: jest.fn() };
  const emit = jest.fn();
  let gateway: ClassGateway;
  const client = { data: {}, emit } as unknown as Socket;
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    reusable.checkEnrollment.mockResolvedValue({
      class: { instructor_id: 'teacher' },
      user: { name: 'Student' },
    });
    reusable.checkPerk.mockResolvedValue({
      perk: { perk: { key: 'spotlight', title: 'Spotlight' }, autoApprove: true },
    });
    gateway = new ClassGateway(
      service as unknown as ClassService,
      reusable as unknown as ReusableService,
      {} as SkillsService,
      {} as PrismaService,
      access as unknown as PrototypePerkAccess,
    );
    gateway.server = { to: jest.fn(() => ({ emit })) } as unknown as Server;
  });
  afterEach(() => jest.restoreAllMocks());
  it('requires instructor session authorization before deciding a new perk', async () => {
    access.teacher.mockRejectedValue(new ForbiddenException('instructor required'));
    await gateway.handleApprovePerkResponse(client, {
      classId: 'class',
      studentId: 'student',
      perkId: 'perk',
      isApproved: true,
      teacherId: 'teacher',
    });
    expect(access.teacher).toHaveBeenCalledWith(client, 'class', false);
    expect(service.decideNewPerk).not.toHaveBeenCalled();
  });
  it.each([true, false])(
    'routes teacher decision %s through the approval service',
    async (isApproved) => {
      service.decideNewPerk.mockResolvedValue({
        success: true,
        message: 'decided',
        data: { pendingCompletion: isApproved, waitingForTrigger: isApproved },
      });
      await gateway.handleApprovePerkResponse(client, {
        classId: 'class',
        studentId: 'student',
        perkId: 'perk',
        isApproved,
        teacherId: 'teacher',
      });
      expect(service.decideNewPerk).toHaveBeenCalledWith('class', 'student', 'perk', isApproved);
      expect(emit).toHaveBeenCalledWith(
        'perk-action-confirmation',
        expect.objectContaining({ success: true, action: isApproved ? 'approved' : 'denied' }),
      );
      expect(emit).not.toHaveBeenCalledWith('perk-used', expect.anything());
    },
  );
  it('requests teacher approval even if stale seed data says auto-approve', async () => {
    service.activateStudentPerk.mockResolvedValue({ success: true, message: 'requested' });
    await gateway.handleApprovePerk(client, {
      classId: 'class',
      studentId: 'student',
      perk: { id: 'perk', title: 'Spotlight' },
    } as Parameters<ClassGateway['handleApprovePerk']>[1]);
    expect(access.student).toHaveBeenCalledWith(client, 'class', 'student', false);
    expect(service.activateStudentPerk).toHaveBeenCalledWith('class', 'student', 'perk');
  });
});
