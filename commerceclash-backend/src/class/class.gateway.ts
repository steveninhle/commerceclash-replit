/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, forwardRef, Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JoinRoomDto } from './dto/join-room.dto';
import { AssignCeoResponseData } from './dto/assign-ceo/assign-ceo-response.dto';
import { PerkApproveRequest, PerkApproveResponse } from './dto/perk-dto/perk-approve.dto';
import { ReusableService } from '@utils/common/classes/reusable';
import { ClassService } from './class.service';
import { Enrollment } from '@utils/common/types/types';
import { PerkApprovalRequest } from './dto/perk-dto/perk-approval-request.dto';
import { PerkUsedDto } from './dto/perk-dto/perk-used.dto';
import { MomentOfGloryDto } from './dto/perk-dto/moment-of-glory.dto';
import { TrailblazerScenarioSelectedDto } from './dto/perk-dto/trailblazer.dto';
import { ManagePerkDto } from './dto/perk-dto/manage-perk.dto';
import { perk_status } from '@prisma/client';
import { SkillsService } from '../skills/skills.service';
import { ReveredIcon } from '../gamification/systems/ReveredIcon';
import { FanTheFlames } from '../gamification/systems/FanTheFlames';
import { PrismaService } from '@utils/prisma/prisma.service';
import { isNewPerkKey } from '../gamification/utils/reactivePerkKeys';
import { PrototypePerkAccess } from './prototype-perk-access';
import { allowedOrigins } from '../utils/config/allowed-origins';

// Interface for pending perk activations that can be cancelled by Revered Icon
interface PendingPerkActivation {
  classId: string;
  studentId: string;
  studentName: string;
  perkId: string;
  perkTitle: string;
  commanderId: string;
  commanderName: string;
  reveredIconPerkId: string;
  timeout: NodeJS.Timeout;
  resolveActivation: () => void;
  rejectActivation: (reason: string) => void;
}

// Tracks a live "who takes this MS loss" decision offered to a Fan the
// Flames holder, mirroring PendingPerkActivation's cancel-window pattern.
interface PendingFanTheFlamesDecision {
  classId: string;
  victimStudentId: string;
  victimEnrollmentId: string;
  fanTheFlamesPerkId: string;
  amount: number;
  sourcePerkTitle: string;
  attackerName: string;
  timeout: NodeJS.Timeout;
  resolveDecision: (result: {
    enrollmentId: string;
    studentId: string;
    redirected: boolean;
  }) => void;
}

@WebSocketGateway({ cors: { origin: allowedOrigins, credentials: true } })
export class ClassGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;
  constructor(
    @Inject(forwardRef(() => ClassService))
    private readonly classService: ClassService,
    private readonly resuable: ReusableService,
    private readonly skillsService: SkillsService,
    private readonly prismaService: PrismaService,
    private readonly prototypeAccess: PrototypePerkAccess,
  ) {}
  private readonly logger = new Logger(ClassGateway.name);
  private studentSocketMap = new Map<string, string>();
  private teacherSocketMap = new Map<string, string>();

  // Track pending perk activations that can be cancelled by Revered Icon
  private pendingPerkActivations = new Map<string, PendingPerkActivation>();

  // Track pending "who takes this MS loss" decisions offered to Fan the Flames holders
  private pendingFanTheFlamesDecisions = new Map<string, PendingFanTheFlamesDecision>();

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('ClassGateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    if (client.data.studentId) {
      // Only remove if this socket is still the registered one (avoid removing a newer reconnect)
      if (this.studentSocketMap.get(client.data.studentId) === client.id) {
        this.studentSocketMap.delete(client.data.studentId);
      }
    } else if (client.data.teacherId) {
      if (this.teacherSocketMap.get(client.data.teacherId) === client.id) {
        this.teacherSocketMap.delete(client.data.teacherId);
      }
    }
  }

  /** Registers authenticated lab sockets without creating or joining a meeting. */
  @SubscribeMessage('join-perk-test')
  async handleJoinPerkTest(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    dto: {
      classId: string;
      role: 'teacher' | 'student';
      studentId?: string;
    },
  ) {
    try {
      if (dto.role === 'student' && dto.studentId) {
        await this.prototypeAccess.student(client, dto.classId, dto.studentId);
        await client.join(dto.classId);
        this.studentSocketMap.set(dto.studentId, client.id);
        client.data.studentId = dto.studentId;
        client.data.type = 'student';
      } else if (dto.role === 'teacher') {
        await this.prototypeAccess.teacher(client, dto.classId);
        const classroom = await this.prismaService.renamedclass.findUniqueOrThrow({
          where: { id: dto.classId },
        });
        await client.join(dto.classId);
        this.teacherSocketMap.set(classroom.instructor_id, client.id);
        client.data.teacherId = classroom.instructor_id;
        client.data.type = 'teacher';
      } else {
        throw new BadRequestException('Choose a valid student or teacher session.');
      }
      client.emit('perk-test-joined', {
        success: true,
        message: 'Connected to the perk test class.',
        data: { classId: dto.classId },
      });
    } catch (error: unknown) {
      client.emit('perk-test-joined', {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @SubscribeMessage('perk-test-trigger')
  async handlePerkTestTrigger(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    dto: {
      classId: string;
      studentId: string;
      perkKey: string;
      predictedType?: string;
    },
  ) {
    try {
      await this.prototypeAccess.student(client, dto.classId, dto.studentId);
      const result = await this.classService.triggerApprovedPerkForTest(
        dto.classId,
        dto.studentId,
        dto.perkKey,
        dto.predictedType,
      );
      client.emit('perk-test-trigger-result', {
        ...result,
        data: { ...result.data, perkKey: dto.perkKey },
      });
      if (result.success) {
        client.emit('perk-activated', {
          ...result,
          data: {
            studentId: dto.studentId,
            perkId: result.data?.perkId,
            perk_status: result.data?.pendingCompletion ? 'approved' : 'used',
            effects: result.data,
          },
        });
        this.server.to(dto.classId).emit('perk-test-state-changed', { classId: dto.classId });
      }
    } catch (error: unknown) {
      client.emit('perk-test-trigger-result', {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        data: { perkKey: dto.perkKey },
      });
    }
  }

  /** Simulates an incoming one-MS loss to exercise the approved passive guardian. */
  @SubscribeMessage('perk-test-ms-loss')
  async handlePerkTestMsLoss(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    dto: {
      classId: string;
      studentId: string;
    },
  ) {
    try {
      await this.prototypeAccess.student(client, dto.classId, dto.studentId);
      const enrollment = await this.resuable.checkEnrollment(dto.classId, dto.studentId);
      const ownId = enrollment.enrolledStudent.id;
      if (!(await FanTheFlames.findAvailable(this.prismaService, ownId))) {
        throw new BadRequestException(
          'Fan the Flames must be unlocked and approved before testing.',
        );
      }
      if ((enrollment.enrolledStudent.market_share ?? 0) < 1) {
        throw new BadRequestException(
          'Set at least one Market Share before testing an incoming loss.',
        );
      }
      const decision = await this.checkAndOfferFanTheFlames(
        dto.classId,
        dto.studentId,
        ownId,
        1,
        'Perk test',
        'Test event',
      );
      const applied = await this.prismaService.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT id FROM enrolled_students WHERE id = ${decision.finalTargetEnrollmentId}::uuid FOR UPDATE`;
        const target = await tx.enrolled_students.findFirst({
          where: {
            id: decision.finalTargetEnrollmentId,
            class_id: dto.classId,
            is_cancelled: { not: true },
          },
        });
        if (!target) throw new BadRequestException('The loss target is no longer enrolled.');
        const loss = Math.min(1, Math.max(0, target.market_share ?? 0));
        await tx.enrolled_students.update({
          where: { id: target.id },
          data: { market_share: { decrement: loss } },
        });
        return { loss, targetStudentId: target.student_id, wasRedirected: decision.wasRedirected };
      });
      client.emit('perk-test-ms-loss-result', {
        success: true,
        message: 'Test Market Share loss applied.',
        data: applied,
      });
      this.server.to(dto.classId).emit('perk-test-state-changed', { classId: dto.classId });
    } catch (error: unknown) {
      client.emit('perk-test-ms-loss-result', {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() dto: JoinRoomDto) {
    try {
      if (dto.studentId) {
        this.studentSocketMap.set(dto.studentId, client.id);

        client.data.studentId = dto.studentId;
        client.data.type = 'student';
      } else if (dto.teacherId) {
        if (!this.teacherSocketMap) this.teacherSocketMap = new Map();

        this.teacherSocketMap.set(dto.teacherId, client.id);
        client.data.teacherId = dto.teacherId;
        client.data.type = 'teacher';
      } else {
        throw new BadRequestException('Either studentId or teacherId must be provided');
      }

      await Promise.all(
        dto.classId.map(async (room) => {
          await client.join(room);
          this.logger.log(`Client ${client.id} (${client.data.type}) joined room: ${room}`);
        }),
      );

      // Emit current class status to students when they join
      if (dto.studentId) {
        await Promise.all(
          dto.classId.map(async (room) => {
            const classData = await this.classService.getClassStatus(room);
            if (classData) {
              client.emit('class-status', {
                success: true,
                message: classData.is_active
                  ? `Class ${classData.name} is active`
                  : `Class ${classData.name} is inactive`,
                data: {
                  class_id: room,
                  name: classData.name,
                  status: classData.is_active,
                },
              });
            }
          }),
        );
      }

      client.emit('joined-room', {
        success: true,
        message: 'Class Rooms joined successfully',
        data: {
          class_ids: dto.classId,
          type: client.data.type,
        },
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error joining room(s): ${errorMsg}`);
      client.emit('ws-error', {
        success: false,
        message: errorMsg || 'Failed to join one or more rooms',
      });
    }
  }

  emitClassListUpdated(studentIds: string[]) {
    for (const studentId of studentIds) {
      const socketId = this.studentSocketMap.get(studentId);
      if (socketId) {
        this.server.to(socketId).emit('class-list-updated', { success: true });
      }
    }
  }

  emitClassStatus(classId: string, name: string, isActive: boolean) {
    const status = isActive ? 'started' : 'ended';
    const message = isActive
      ? `Teacher has joined Class: ${name}`
      : `Teacher has left Class: ${name}`;

    this.logger.log(`Emitting 'class-status' (${status}) for class ${classId}`);

    this.server.to(classId).emit('class-status', {
      success: true,
      message,
      data: {
        class_id: classId,
        name: name,
        status: isActive,
      },
    });
  }

  emitAssignCeo(studentId: string, result: AssignCeoResponseData, classId: string) {
    const socketId = this.studentSocketMap.get(studentId);

    if (!socketId) {
      this.logger.warn(
        `emitAssignCeo: no socket found for studentId=${studentId} in class=${classId}. Student may be offline.`,
      );
      return;
    }

    // Emit only to the specific student's socket — no class-wide broadcast
    this.server.to(socketId).emit('assigned-ceo', {
      success: true,
      message: `CEO ${result.archetype.title} has been assigned to you`,
      data: { result },
    });
  }

  emitPerkActivated(
    _studentId: string,
    classId: string,
    payload: { success: boolean; message: string; data: Record<string, unknown> },
  ) {
    // Broadcast to the class room — student is in this room so no individual emit needed
    this.server.to(classId).emit('perk-activated', payload);
  }

  emitPerkUnlocked(studentId: string, data: { perkId: string; title: string }) {
    const socketId = this.studentSocketMap.get(studentId);
    if (!socketId) {
      this.logger.warn(`emitPerkUnlocked: no socket for studentId=${studentId}`);
      return;
    }
    this.server.to(socketId).emit('perk-unlocked', {
      success: true,
      message: `Perk "${data.title}" has been unlocked`,
      data,
    });
  }

  emitPerkStatusChanged(
    studentId: string,
    data: {
      perkId: string;
      title: string;
      perk_status: 'approved' | 'denied' | 'reset';
      perkKey?: string;
    },
  ) {
    const socketId = this.studentSocketMap.get(studentId);
    if (!socketId) {
      this.logger.warn(`emitPerkStatusChanged: no socket for studentId=${studentId}`);
      return;
    }
    const messages: Record<string, string> = {
      approved: `Perk "${data.title}" approved by teacher`,
      denied: `Perk "${data.title}" denied by teacher`,
      reset: `Perk "${data.title}" has been reset`,
    };
    this.server.to(socketId).emit('perk-status-changed', {
      success: true,
      message: messages[data.perk_status] ?? `Perk "${data.title}" updated`,
      data,
    });
  }

  emitXpUpdated(studentId: string, data: { xp: number; level: number }, classId?: string) {
    const payload = {
      success: true,
      message: 'Your XP and level have been updated',
      data: { ...data, studentId },
    };
    if (classId) {
      this.server.to(classId).emit('xp-updated', payload);
    } else {
      const socketId = this.studentSocketMap.get(studentId);
      if (socketId) {
        this.server.to(socketId).emit('xp-updated', payload);
      } else {
        this.logger.warn(`emitXpUpdated: no socket for studentId=${studentId}`);
      }
    }
  }

  emitLeaderboardUpdated(
    classId: string,
    students: Array<{
      id: string | null;
      name: string | null;
      marketShare: number | null;
      ceo: { id: string | null; title: string | null };
    }>,
  ) {
    this.server.to(classId).emit('leaderboard-updated', {
      success: true,
      message: 'Leaderboard updated',
      data: {
        students: students.map((s) => ({
          id: s.id,
          name: s.name,
          market_share: s.marketShare ?? 0,
          ceo: s.ceo,
        })),
      },
    });
  }

  @SubscribeMessage('perk-approve-request')
  async handleApprovePerk(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: PerkApproveRequest,
  ) {
    try {
      const enrollment: Enrollment = await this.resuable.checkEnrollment(
        dto.classId,
        dto.studentId,
      );
      const teacherId = enrollment.class.instructor_id;
      const socketId = this.teacherSocketMap.get(teacherId);
      let socket: Socket | undefined;
      if (socketId) {
        socket = this.server.sockets.sockets.get(socketId);
      }
      const perk = await this.resuable.checkPerk(dto.perk.id);

      this.logger.log(
        `[handleApprovePerk] Perk info: key="${perk.perk.perk.key}", title="${perk.perk.perk.title}", autoApprove=${perk.perk.autoApprove}`,
      );

      if (isNewPerkKey(perk.perk.perk.key)) {
        await this.prototypeAccess.student(client, dto.classId, dto.studentId, false);
        const result = await this.classService.activateStudentPerk(
          dto.classId,
          dto.studentId,
          dto.perk.id,
        );
        client.emit('perk-request-sent', {
          ...result,
          data: { perkId: dto.perk.id, perk_status: 'pending' },
        });
        return;
      }

      // Check if perk is auto-approve (no teacher approval needed)
      if (perk.perk.autoApprove) {
        this.logger.log(`[handleApprovePerk] Auto-approve perk detected: ${perk.perk.perk.title}`);

        // Automatically activate the perk without teacher approval
        try {
          const activationResult = await this.classService.activatePerkAfterApproval(
            dto.classId,
            dto.studentId,
            dto.perk.id,
          );

          // If the perk effect itself failed (e.g. condition not met), notify and bail out
          if (!activationResult.success) {
            client.emit('perk-activation-error', {
              success: false,
              message:
                activationResult.message ?? `Perk "${perk.perk.perk.title}" condition not met`,
              data: { perkId: dto.perk.id, perkTitle: perk.perk.perk.title },
            });
            return;
          }

          const requiresSelection =
            (activationResult.data as Record<string, unknown>)?.requiresSelection === true;
          const pendingCompletion =
            (activationResult.data as Record<string, unknown>)?.pendingCompletion === true;

          this.logger.log(
            `[handleApprovePerk] Auto-approve activation result: ${JSON.stringify({
              requiresSelection,
              pendingCompletion,
              hasScenarioCards: !!(activationResult.data as Record<string, unknown>)?.scenarioCards,
              scenarioCardsCount: (
                (activationResult.data as Record<string, unknown>)?.scenarioCards as unknown[]
              )?.length,
            })}`,
          );

          const perkActivatedPayload = {
            success: true,
            message: requiresSelection
              ? `${perk.perk.perk.title} activated - please complete the selection`
              : `${perk.perk.perk.title} has been activated!`,
            data: {
              studentId: dto.studentId,
              perkId: dto.perk.id,
              perkTitle: perk.perk.perk.title,
              perk_status: pendingCompletion ? 'approved' : 'used',
              effects: activationResult.data,
            },
          };

          this.logger.log(
            `[handleApprovePerk] Emitting perk-activated to client: ${JSON.stringify(perkActivatedPayload)}`,
          );

          // Corporate Espionage contains rival skill trees — emit only to the perk owner
          if (perk.perk.perk.key === 'corporate_espionage') {
            client.emit('perk-activated', perkActivatedPayload);
          } else {
            this.server.to(dto.classId).emit('perk-activated', perkActivatedPayload);
          }

          // Notify teacher (informational only, no approval needed)
          socket?.emit('perk-used', {
            success: true,
            message: `${enrollment.user.name} used auto-approve perk: ${perk.perk.perk.title}`,
          });

          return;
        } catch (activationError) {
          const errorMsg =
            activationError instanceof Error ? activationError.message : String(activationError);
          this.logger.error(`Error during auto-approve perk activation: ${errorMsg}`);
          client.emit('perk-activation-error', {
            success: false,
            message: `Perk activation failed: ${errorMsg}`,
            data: { perkId: dto.perk.id, perkTitle: perk.perk.perk.title },
          });
          return;
        }
      }

      // Standard flow: requires teacher approval
      await this.classService.updatePerkStatus(dto.perk.id, 'pending' as perk_status);

      // Notify teacher about the perk request — emit to class room so all teacher windows receive it
      this.server.to(dto.classId).emit('perk-approve-request', {
        success: true,
        message: `${enrollment.user.name} has requested to use perk ${perk.perk.perk.title}`,
        data: {
          studentId: enrollment.user.id,
          name: enrollment.user.name,
          perk: { id: dto.perk.id, title: perk.perk.perk.title },
        },
      });

      // Send confirmation back to the requesting student
      client.emit('perk-request-confirmation', {
        success: true,
        message: 'Perk request sent to teacher',
        data: {
          perkId: dto.perk.id,
          perkTitle: perk.perk.perk.title,
          status: 'pending',
        },
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error requesting perk approval: ${errorMsg}`);
      client.emit('ws-error', {
        success: false,
        message: errorMsg || 'Failed to request for perk approval',
      });
    }
  }

  @SubscribeMessage('perk-approve-response')
  async handleApprovePerkResponse(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: PerkApproveResponse,
  ) {
    this.logger.log(
      `[${client.data.type || 'unknown'}] ${client.id} -> perk-approve-response with payload: ${JSON.stringify(dto)}`,
    );

    try {
      const enrollment: Enrollment = await this.resuable.checkEnrollment(
        dto.classId,
        dto.studentId,
      );

      const socketId = this.studentSocketMap.get(dto.studentId);
      let socket: Socket | undefined;

      if (socketId) {
        socket = this.server.sockets.sockets.get(socketId);
      }

      const perk = await this.resuable.checkPerk(dto.perkId);

      if (isNewPerkKey(perk.perk.perk.key)) {
        await this.prototypeAccess.teacher(client, dto.classId, false);
        const result = await this.classService.decideNewPerk(
          dto.classId,
          dto.studentId,
          dto.perkId,
          dto.isApproved,
        );
        const waiting = result.data?.pendingCompletion === true;
        const status = !dto.isApproved
          ? 'denied'
          : !result.success
            ? 'pending'
            : waiting
              ? 'approved'
              : 'used';
        const payload = {
          ...result,
          data: {
            studentId: dto.studentId,
            perkId: dto.perkId,
            perkTitle: perk.perk.perk.title,
            perk_status: status,
            effects: result.data,
          },
        };
        socket?.emit(
          !dto.isApproved
            ? 'perk-denied'
            : !result.success
              ? 'perk-activation-error'
              : 'perk-activated',
          payload,
        );
        client.emit('perk-action-confirmation', {
          ...result,
          action: dto.isApproved ? 'approved' : 'denied',
          data: { perkId: dto.perkId },
        });
        if (dto.isApproved && result.success && !waiting) client.emit('perk-used', payload);
        return;
      }

      if (dto.isApproved) {
        // Check if a Commander has Revered Icon and can cancel this perk
        const reveredIconCheck = await this.checkAndNotifyReveredIcon(
          dto.classId,
          dto.studentId,
          enrollment.user.name ?? 'Student',
          dto.perkId,
          perk.perk.perk.title,
        );

        if (reveredIconCheck.hasPending && reveredIconCheck.waitForCancel) {
          // Notify the student that their perk is pending (can be cancelled)
          socket?.emit('perk-pending-commander-review', {
            success: true,
            message: `Your ${perk.perk.perk.title} is approved but a Commander may cancel it. Waiting...`,
            data: {
              perkId: dto.perkId,
              perkTitle: perk.perk.perk.title,
              cancelWindowMs: ReveredIcon.CANCEL_WINDOW_MS,
            },
          });

          // Wait for the cancel window or cancellation
          try {
            await reveredIconCheck.waitForCancel;
            this.logger.log(`Revered Icon window passed - proceeding with ${perk.perk.perk.title}`);
          } catch (cancelReason: unknown) {
            // Perk was cancelled by Commander
            const reason =
              cancelReason instanceof Error ? cancelReason.message : String(cancelReason);
            this.logger.log(`Perk ${perk.perk.perk.title} was cancelled: ${reason}`);

            socket?.emit('perk-denied', {
              success: false,
              message: `Your ${perk.perk.perk.title} was cancelled by a Commander using Revered Icon!`,
              data: { perkId: dto.perkId, perkKey: perk.perk.perk.key },
            });

            client.emit('perk-action-confirmation', {
              success: true,
              message: `${perk.perk.perk.title} was cancelled by a Commander`,
              action: 'cancelled_by_commander',
            });
            return;
          }
        }

        // Automatically activate the perk after approval (and after Revered Icon window)
        try {
          const activationResult = await this.classService.activatePerkAfterApproval(
            dto.classId,
            dto.studentId,
            dto.perkId,
            dto.additionalData,
          );

          // If the perk effect itself failed (e.g. condition not met), notify and bail out
          if (!activationResult.success) {
            socket?.emit('perk-activation-error', {
              success: false,
              message:
                activationResult.message ?? `Perk "${perk.perk.perk.title}" condition not met`,
              data: { perkId: dto.perkId, perkTitle: perk.perk.perk.title },
            });
            client.emit('perk-action-confirmation', {
              success: false,
              message:
                activationResult.message ?? `Perk "${perk.perk.perk.title}" condition not met`,
              action: 'approved',
              data: { perkId: dto.perkId },
            });
            return;
          }

          // Check if perk requires additional selection (e.g., Sabotage target selection)
          const requiresSelection =
            (activationResult.data as Record<string, unknown>)?.requiresSelection === true;
          const pendingCompletion =
            (activationResult.data as Record<string, unknown>)?.pendingCompletion === true;

          this.logger.log(
            `[handleApprovePerkResponse] activationResult.data: ${JSON.stringify(activationResult.data)}`,
          );
          this.logger.log(
            `[handleApprovePerkResponse] requiresSelection: ${requiresSelection}, pendingCompletion: ${pendingCompletion}`,
          );

          // Emit perk-activated event to student
          const perkActivatedPayload = {
            success: true,
            message: requiresSelection
              ? `Perk "${perk.perk.perk.title}" approved - please complete the selection`
              : `Perk "${perk.perk.perk.title}" has been approved and activated`,
            data: {
              studentId: dto.studentId,
              perkId: dto.perkId,
              perkTitle: perk.perk.perk.title,
              perk_status: pendingCompletion ? 'approved' : 'used',
              effects: activationResult.data,
            },
          };

          this.logger.log(
            `[handleApprovePerkResponse] Emitting perk-activated: ${JSON.stringify(perkActivatedPayload)}`,
          );

          // Some perks contain sensitive data (rival skill trees, redistribution details)
          // — emit only to the perk owner so other students don't see the payload.
          const privatePerks = [
            'corporate_espionage',
            'sabotage',
            'trendsetter',
            'danger_zone',
            'star_power',
          ];
          if (privatePerks.includes(perk.perk.perk.key)) {
            socket?.emit('perk-activated', perkActivatedPayload);
          } else {
            this.server.to(dto.classId).emit('perk-activated', perkActivatedPayload);
          }

          // Notify affected rivals to refresh their skill points (e.g. Wipeout)
          const affectedStudentIds = activationResult.data?.affectedStudentIds as
            | string[]
            | undefined;
          if (affectedStudentIds?.length) {
            for (const rivalStudentId of affectedStudentIds) {
              const rivalEnrollment = await this.resuable.checkEnrollment(
                dto.classId,
                rivalStudentId,
              );
              const skillData = await this.skillsService.getStudentSkill(
                rivalEnrollment.enrolledStudent.id,
              );
              const updates =
                'orderedSkills' in skillData
                  ? skillData.orderedSkills.map((s) => ({ skillId: s.id, value: s.value }))
                  : [];
              this.server.to(dto.classId).emit('skill-updated', {
                type: 'SKILL_UPDATED',
                studentId: rivalStudentId,
                updates,
              });
            }
          }

          // Only emit perk-used to teacher if perk is fully completed
          if (!pendingCompletion) {
            client.emit('perk-used', {
              success: true,
              message: `Perk "${perk.perk.perk.title}" has been activated for ${enrollment.user.name}`,
              data: {
                perkId: dto.perkId,
                studentId: dto.studentId,
              },
            });
          }

          // Send confirmation back to teacher
          client.emit('perk-action-confirmation', {
            success: true,
            message: requiresSelection
              ? `Approved "${perk.perk.perk.title}" for ${enrollment.user.name} - awaiting target selection`
              : `Approved and activated "${perk.perk.perk.title}" for ${enrollment.user.name}`,
            action: 'approved',
            data: { perkId: dto.perkId },
          });
        } catch (activationError) {
          const errorMsg =
            activationError instanceof Error ? activationError.message : String(activationError);
          this.logger.error(`Error during automatic perk activation: ${errorMsg}`);

          // Emit error to student
          socket?.emit('perk-activation-error', {
            success: false,
            message: `Perk was approved but activation failed: ${errorMsg}`,
            data: {
              perkId: dto.perkId,
              perkTitle: perk.perk.perk.title,
            },
          });

          // Still send confirmation to teacher about approval
          client.emit('perk-action-confirmation', {
            success: false,
            message: `Approved "${perk.perk.perk.title}" for ${enrollment.user.name} but activation failed`,
            action: 'approved',
            error: errorMsg,
            data: { perkId: dto.perkId },
          });
        }
      } else {
        const isApproved = await this.classService.updatePerk(dto.perkId, 'denied' as perk_status);
        socket?.emit('perk-denied', {
          success: true,
          message: `Perk "${perk.perk.perk.title}" has been declined by your teacher`,
          data: {
            is_approved: isApproved.is_approved,
            perk_status: isApproved.perk_status,
            perkTitle: perk.perk.perk.title,
            perkKey: perk.perk.perk.key,
          },
        });

        // Send confirmation back to teacher
        client.emit('perk-action-confirmation', {
          success: true,
          message: `Declined "${perk.perk.perk.title}" for ${enrollment.user.name}`,
          action: 'denied',
          data: { perkId: dto.perkId },
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error handling perk approval response: ${errorMsg}`);
      client.emit('ws-error', {
        success: false,
        message: errorMsg || 'Failed to process perk approval response',
      });
    }
  }

  emitPerkApprovalRequest(dto: PerkApprovalRequest) {
    this.server.to(dto.classId).emit('perk-approve-request', {
      success: true,
      message: `${dto.student.name} has requested to use perk ${dto.perk.title}`,
      data: {
        studentId: dto.student.id,
        name: dto.student.name,
        perk: { id: dto.perk.id, title: dto.perk.title },
      },
    });
  }

  emitPerkUsed(dto: PerkUsedDto) {
    const studentSocketId = this.studentSocketMap.get(dto.student.id);
    let studentSocket: Socket | undefined;
    const socketId = this.teacherSocketMap.get(dto.teacherId);
    let socket: Socket | undefined;

    if (socketId) {
      socket = this.server.sockets.sockets.get(socketId);
    }
    if (studentSocketId) {
      studentSocket = this.server.sockets.sockets.get(studentSocketId);
    }
    studentSocket?.emit('perk-used', {
      success: true,
      message: `You have used the perk: ${dto.perk.title}.`,
    });
    socket?.emit('perk-used', {
      success: true,
      message: `Perk ${dto.perk.title} has been used by ${dto.student.name}.`,
    });
  }

  emitMomentOfGlory(dto: MomentOfGloryDto) {
    const socketId = this.teacherSocketMap.get(dto.teacherId);
    let socket: Socket | undefined;

    if (socketId) {
      socket = this.server.sockets.sockets.get(socketId);
    }

    socket?.emit('moment-of-glory', {
      success: true,
      message: `Moment of Glory activated for ${dto.student.name}.`,
      data: { student: dto.student },
    });
  }

  /**
   * Handle scenario selection from Trailblazer perk
   * The student selects one of the two drawn scenario cards
   * The chosen scenario becomes the official class scenario (no teacher approval needed)
   */
  @SubscribeMessage('trailblazer-scenario-selected')
  async handleTrailblazerScenarioSelected(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: TrailblazerScenarioSelectedDto,
  ) {
    this.logger.log(
      `[${client.data.type || 'unknown'}] ${client.id} -> trailblazer-scenario-selected with payload: ${JSON.stringify(dto)}`,
    );

    try {
      const enrollment: Enrollment = await this.resuable.checkEnrollment(
        dto.classId,
        dto.studentId,
      );

      const perk = await this.resuable.checkPerk(dto.perkId);

      // Mark the perk as used now that selection is complete
      // This sets is_used = true and is_approved = false
      await this.classService.markPerkAsUsedById(dto.perkId);

      // Broadcast the selected scenario to all students in the class
      this.server.to(dto.classId).emit('class-scenario-set', {
        success: true,
        message: `${enrollment.user.name} has set the class scenario using Trailblazer!`,
        data: {
          scenario: dto.selectedScenario,
          selectedBy: {
            id: enrollment.user.id,
            name: enrollment.user.name,
          },
        },
      });

      // Notify the teacher about the scenario selection
      const teacherId = enrollment.class.instructor_id;
      const teacherSocketId = this.teacherSocketMap.get(teacherId);
      if (teacherSocketId) {
        const teacherSocket = this.server.sockets.sockets.get(teacherSocketId);
        teacherSocket?.emit('trailblazer-scenario-chosen', {
          success: true,
          message: `${enrollment.user.name} chose scenario: ${dto.selectedScenario.title}`,
          data: {
            perkId: dto.perkId,
            perk_status: 'used',
            student: {
              id: enrollment.user.id,
              name: enrollment.user.name,
            },
            scenario: dto.selectedScenario,
          },
        });
      }

      // Confirm to the student that their selection was successful
      client.emit('perk-activated', {
        success: true,
        message: `Scenario "${dto.selectedScenario.title}" has been set for the class!`,
        data: {
          perkId: dto.perkId,
          perkTitle: perk.perk.perk.title,
          perk_status: 'used',
          effects: {
            scenarioSet: true,
            scenario: dto.selectedScenario,
          },
        },
      });

      this.logger.log(
        `Trailblazer: ${enrollment.user.name} set class scenario to "${dto.selectedScenario.title}"`,
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error handling trailblazer scenario selection: ${errorMsg}`);
      client.emit('perk-activation-error', {
        success: false,
        message: errorMsg || 'Failed to set class scenario',
        data: { perkId: dto.perkId },
      });
    }
  }

  @SubscribeMessage('perk-cancel')
  async handlePerkCancel(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { classId: string; studentId: string; perkId: string; perkKey: string },
  ) {
    this.logger.log(
      `[${client.data.type || 'unknown'}] ${client.id} -> perk-cancel for perkKey=${dto.perkKey}`,
    );

    try {
      const enrollment = await this.resuable.checkEnrollment(dto.classId, dto.studentId);

      // Trendsetter Phase 1 already gave +1 MS — roll it back
      if (dto.perkKey === 'trendsetter') {
        await this.prismaService.enrolled_students.update({
          where: { id: enrollment.enrolledStudent.id },
          data: { market_share: { decrement: 1 } },
        });
        this.logger.log(`perk-cancel: rolled back +1 MS for Trendsetter student ${dto.studentId}`);
      }

      // Reset perk to initial state (same as denied: perk_status=null, is_approved=false, is_used=false)
      await this.classService.updatePerk(dto.perkId, 'denied' as perk_status);

      // Confirm to student
      client.emit('perk-cancel-confirmed', {
        success: true,
        message: 'Perk cancelled.',
        data: { perkId: dto.perkId },
      });

      // Notify teacher so manage table updates
      const teacherSocketId = this.teacherSocketMap.get(enrollment.class.instructor_id);
      if (teacherSocketId) {
        const teacherSocket = this.server.sockets.sockets.get(teacherSocketId);
        teacherSocket?.emit('perk-cancel-confirmed', {
          success: true,
          message: `${enrollment.user.name} cancelled their perk selection.`,
          data: { perkId: dto.perkId },
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error cancelling perk: ${errorMsg}`);
      client.emit('perk-cancel-confirmed', {
        success: false,
        message: errorMsg || 'Failed to cancel perk',
        data: { perkId: dto.perkId },
      });
    }
  }

  /**
   * There is no task-grading system yet — this simulates the event it will
   * eventually emit ("a task was scored") so the perks that react to an Elite
   * score (Spotlight, Star Power) can be wired up and tested end-to-end today.
   * Both require teacher approval before they can react to
   * the score. Star Power's effect needs a target choosing a rival
   * afterward, so its Phase 1 result flows to the client the same way
   * Sabotage/Trendsetter/Danger Zone do; the client completes it by emitting
   * 'perk-complete-with-target' with the perkId Phase 1 hands back.
   */
  @SubscribeMessage('task-score-submitted')
  async handleTaskScoreSubmitted(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { classId: string; studentId: string; score: string },
  ) {
    this.logger.log(
      `[${client.data.type || 'unknown'}] ${client.id} -> task-score-submitted: score=${dto.score}`,
    );

    try {
      const isElite = dto.score?.toLowerCase() === 'elite';
      await this.prototypeAccess.student(client, dto.classId, dto.studentId);

      if (!isElite) {
        client.emit('task-score-result', {
          success: true,
          message: `Score "${dto.score}" recorded — Spotlight and Star Power only trigger on an Elite score.`,
          data: { score: dto.score, perkTriggered: false },
        });
        return;
      }

      const [spotlightResult, starPowerResult] = await Promise.all([
        this.classService.triggerSpotlightForEliteScore(dto.classId, dto.studentId),
        this.classService.triggerStarPowerForEliteScore(dto.classId, dto.studentId),
      ]);

      client.emit('task-score-result', {
        success: spotlightResult.success || starPowerResult.success,
        message: 'Elite score processed — Spotlight and Star Power results below.',
        data: {
          score: dto.score,
          perkTriggered: spotlightResult.success,
          spotlight: spotlightResult,
          starPower: starPowerResult,
        },
      });

      if (spotlightResult.success) {
        client.emit('perk-activated', {
          success: true,
          message: spotlightResult.message,
          data: {
            studentId: dto.studentId,
            perkId: (spotlightResult.data as Record<string, unknown> | undefined)?.perkId,
            perkTitle: 'Spotlight',
            perk_status: 'used',
            effects: spotlightResult.data,
          },
        });
      }

      if (starPowerResult.success) {
        const starPowerData = starPowerResult.data as Record<string, unknown> | undefined;
        const isPendingCompletion = starPowerData?.pendingCompletion === true;

        client.emit('perk-activated', {
          success: true,
          message: starPowerResult.message,
          data: {
            studentId: dto.studentId,
            perkId: starPowerData?.perkId,
            perkTitle: 'Star Power',
            perk_status: isPendingCompletion ? 'approved' : 'used',
            effects: starPowerResult.data,
          },
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error processing task score: ${errorMsg}`);
      client.emit('task-score-result', {
        success: false,
        message: errorMsg || 'Failed to process task score',
      });
    }
  }

  /**
   * There is no scenario system yet — this simulates the "predict the next
   * scenario type" popup that should appear at the start of the scenario
   * phase, so the Prophecy perk can be wired up and tested end-to-end today.
   * After teacher approval, Prophecy resolves the
   * prediction against UPCOMING_SCENARIO_TYPE (utils/types/types.ts),
   * a placeholder until the real scenario draw exists to supply the real type.
   */
  @SubscribeMessage('scenario-prediction-submitted')
  async handleScenarioPredictionSubmitted(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { classId: string; studentId: string; predictedType: string },
  ) {
    this.logger.log(
      `[${client.data.type || 'unknown'}] ${client.id} -> scenario-prediction-submitted: predictedType=${dto.predictedType}`,
    );

    try {
      await this.prototypeAccess.student(client, dto.classId, dto.studentId);
      const result = await this.classService.triggerProphecyPrediction(
        dto.classId,
        dto.studentId,
        dto.predictedType,
      );

      client.emit('scenario-prediction-result', {
        success: result.success,
        message: result.message,
        data: result.data,
      });

      if (result.success) {
        const resultData = result.data as Record<string, unknown> | undefined;
        client.emit('perk-activated', {
          success: true,
          message: result.message,
          data: {
            studentId: dto.studentId,
            perkId: resultData?.perkId,
            perkTitle: 'Prophecy',
            perk_status: 'used',
            effects: result.data,
          },
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error processing scenario prediction: ${errorMsg}`);
      client.emit('scenario-prediction-result', {
        success: false,
        message: errorMsg || 'Failed to process scenario prediction',
      });
    }
  }

  /** Prototype invest-phase trigger for Crystal Ball and Insider Trading. */
  @SubscribeMessage('invest-phase-started')
  async handleInvestPhaseStarted(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { classId: string; studentId: string },
  ) {
    this.logger.log(`[${client.data.type || 'unknown'}] ${client.id} -> invest-phase-started`);

    try {
      if (client.data.type !== 'student' || client.data.studentId !== dto.studentId) {
        client.emit('invest-phase-reveal-result', {
          success: false,
          message: 'You are not authorized to trigger this invest phase.',
        });
        return;
      }

      await this.prototypeAccess.student(client, dto.classId, dto.studentId);
      const candidates = await Promise.all([
        this.classService
          .triggerCrystalBallReveal(dto.classId, dto.studentId)
          .then((result) => ({ title: 'Crystal Ball', result })),
        this.classService
          .triggerInsiderTradingReveal(dto.classId, dto.studentId)
          .then((result) => ({ title: 'Insider Trading', result })),
      ]);
      const triggered = candidates.find(({ result }) => result.success);
      const relevant =
        triggered ??
        candidates.find(({ result }) => {
          const data = result.data as Record<string, unknown> | undefined;
          return typeof data?.perkId === 'string';
        }) ??
        candidates[0];

      client.emit('invest-phase-reveal-result', {
        success: relevant.result.success,
        message: relevant.result.message,
        data: {
          ...((relevant.result.data ?? {}) as Record<string, unknown>),
          perkTitle: relevant.title,
        },
      });

      if (triggered) {
        const resultData = triggered.result.data as Record<string, unknown> | undefined;
        client.emit('perk-activated', {
          success: true,
          message: triggered.result.message,
          data: {
            studentId: dto.studentId,
            perkId: resultData?.perkId,
            perkTitle: triggered.title,
            perk_status: 'used',
            effects: triggered.result.data,
          },
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error processing invest phase start: ${errorMsg}`);
      client.emit('invest-phase-reveal-result', {
        success: false,
        message: errorMsg || 'Failed to process invest phase start',
      });
    }
  }

  /** Prototype scenario-phase trigger for Extortion. */
  @SubscribeMessage('scenario-started')
  async handleScenarioStarted(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { classId: string; studentId: string },
  ) {
    this.logger.log(`[${client.data.type || 'unknown'}] ${client.id} -> scenario-started`);

    try {
      if (client.data.type !== 'student' || client.data.studentId !== dto.studentId) {
        client.emit('scenario-started-result', {
          success: false,
          message: 'You are not authorized to trigger this scenario.',
        });
        return;
      }

      await this.prototypeAccess.student(client, dto.classId, dto.studentId);
      const result = await this.classService.triggerExtortionForScenarioStart(
        dto.classId,
        dto.studentId,
      );

      client.emit('scenario-started-result', {
        success: result.success,
        message: result.message,
        data: result.data,
      });

      if (result.success) {
        const resultData = result.data as Record<string, unknown> | undefined;
        client.emit('perk-activated', {
          success: true,
          message: result.message,
          data: {
            studentId: dto.studentId,
            perkId: resultData?.perkId,
            perkTitle: 'Extortion',
            perk_status: resultData?.pendingCompletion === true ? 'approved' : 'used',
            effects: result.data,
          },
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error processing scenario start: ${errorMsg}`);
      client.emit('scenario-started-result', {
        success: false,
        message: errorMsg || 'Failed to start scenario',
      });
    }
  }

  /** Prototype scenario end: reverse active Afterburner and Extortion deltas. */
  @SubscribeMessage('scenario-ended')
  async handleScenarioEnded(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { classId: string },
  ) {
    this.logger.log(`[${client.data.type || 'unknown'}] ${client.id} -> scenario-ended`);

    try {
      await this.prototypeAccess.teacher(client, dto.classId);
      const result = await this.classService.endHardcodedScenario(dto.classId);
      this.server.to(dto.classId).emit('scenario-ended-result', result);
      this.server.to(dto.classId).emit('scenario-temporary-effects-ended', result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error processing scenario end: ${errorMsg}`);
      client.emit('scenario-ended-result', {
        success: false,
        message: errorMsg || 'Failed to end scenario',
      });
    }
  }

  /**
   * There is no scenario system yet — this simulates the scenario being
   * revealed to the class, so the Rebirth perk can be wired up and tested
   * end-to-end today. After teacher approval, Rebirth
   * opens the shifting window once the scenario is revealed.
   */
  @SubscribeMessage('scenario-revealed')
  async handleScenarioRevealed(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { classId: string; studentId: string },
  ) {
    this.logger.log(`[${client.data.type || 'unknown'}] ${client.id} -> scenario-revealed`);

    try {
      await this.prototypeAccess.student(client, dto.classId, dto.studentId);
      const result = await this.classService.triggerRebirthForScenarioReveal(
        dto.classId,
        dto.studentId,
      );

      client.emit('scenario-revealed-result', {
        success: result.success,
        message: result.message,
        data: result.data,
      });

      if (result.success) {
        const resultData = result.data as Record<string, unknown> | undefined;
        client.emit('perk-activated', {
          success: true,
          message: result.message,
          data: {
            studentId: dto.studentId,
            perkId: resultData?.perkId,
            perkTitle: 'Rebirth',
            perk_status: 'used',
            effects: result.data,
          },
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error processing scenario reveal: ${errorMsg}`);
      client.emit('scenario-revealed-result', {
        success: false,
        message: errorMsg || 'Failed to process scenario reveal',
      });
    }
  }

  @SubscribeMessage('perk-complete-with-target')
  async handlePerkCompleteWithTarget(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    dto: {
      classId: string;
      studentId: string;
      perkId: string;
      targetStudentId: string;
      redistribution?: {
        decrements: { skillId: string; amount: number }[];
        increments: { skillId: string; amount: number }[];
      };
      skillDeductions?: { skillId: string; amount: number }[];
    },
  ) {
    this.logger.log(
      `[${client.data.type || 'unknown'}] ${client.id} -> perk-complete-with-target with payload: ${JSON.stringify(dto)}`,
    );

    try {
      if (client.data.type !== 'student' || client.data.studentId !== dto.studentId) {
        throw new BadRequestException({
          success: false,
          message: 'You are not authorized to complete this perk.',
        });
      }

      const enrollment: Enrollment = await this.resuable.checkEnrollment(
        dto.classId,
        dto.studentId,
      );

      const perk = await this.resuable.checkPerk(dto.perkId);

      if (perk.studentPerk.enrollment_id !== enrollment.enrolledStudent.id) {
        throw new BadRequestException({
          success: false,
          message: 'This perk does not belong to the connected student.',
        });
      }

      await this.prototypeAccess.student(client, dto.classId, dto.studentId, false);
      // Execute perk with target selection (and optional redistribution for Sabotage Phase 2→3)
      const activationResult = await this.classService.activatePerkAfterApproval(
        dto.classId,
        dto.studentId,
        dto.perkId,
        {
          targetStudentId: dto.targetStudentId,
          redistribution: dto.redistribution,
          skillDeductions: dto.skillDeductions,
        },
      );

      if (!activationResult.success) {
        client.emit('perk-activation-error', {
          success: false,
          message: activationResult.message,
          data: { perkId: dto.perkId },
        });
        return;
      }

      // Check if perk is pending completion (e.g., Sabotage Phase 2 - waiting for redistribution)
      const isPendingCompletion =
        activationResult.data?.pendingCompletion === true ||
        activationResult.data?.requiresRedistribution === true;

      // Emit success to the student
      client.emit('perk-activated', {
        success: true,
        message: activationResult.message,
        data: {
          perkId: dto.perkId,
          perkTitle: perk.perk.perk.title,
          perk_status: isPendingCompletion ? 'pending' : 'used',
          effects: activationResult.data,
        },
      });

      // Notify teacher only when perk is fully used
      if (!isPendingCompletion) {
        const teacherId = enrollment.class.instructor_id;
        const teacherSocketId = this.teacherSocketMap.get(teacherId);
        if (teacherSocketId) {
          const teacherSocket = this.server.sockets.sockets.get(teacherSocketId);
          teacherSocket?.emit('perk-used', {
            success: true,
            message: `${perk.perk.perk.title} has been used by ${enrollment.user.name}`,
            data: {
              perkId: dto.perkId,
              studentId: dto.studentId,
            },
          });
        }

        // Notify sabotaged rival to refresh their skills
        if (dto.targetStudentId) {
          const targetEnrollment = await this.resuable.checkEnrollment(
            dto.classId,
            dto.targetStudentId,
          );
          const targetSkillData = await this.skillsService.getStudentSkill(
            targetEnrollment.enrolledStudent.id,
          );
          const targetUpdates =
            'orderedSkills' in targetSkillData
              ? targetSkillData.orderedSkills.map((s) => ({ skillId: s.id, value: s.value }))
              : [];
          this.server.to(dto.classId).emit('skill-updated', {
            type: 'SKILL_UPDATED',
            studentId: dto.targetStudentId,
            updates: targetUpdates,
          });
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error completing perk with target: ${errorMsg}`);
      client.emit('perk-activation-error', {
        success: false,
        message: errorMsg || 'Failed to complete perk with target',
        data: { perkId: dto.perkId },
      });
    }
  }

  @SubscribeMessage('manage-perk')
  async handleManagePerk(@ConnectedSocket() client: Socket, @MessageBody() dto: ManagePerkDto) {
    this.logger.log(
      `[${client.data.type || 'unknown'}] ${client.id} -> manage-perk with payload: ${JSON.stringify(dto)}`,
    );

    try {
      // Use teacherId from payload (since socket may not have session data)
      const teacherId = dto.teacherId;
      if (!teacherId || typeof teacherId !== 'string') {
        throw new Error('Unauthorized: Teacher ID is required');
      }

      const result = await this.classService.managePerk(
        teacherId,
        dto.classId,
        dto.studentId,
        dto.perkId,
        dto.action,
      );

      // Notify student
      const studentSocketId = this.studentSocketMap.get(dto.studentId);
      if (studentSocketId) {
        const studentSocket = this.server.sockets.sockets.get(studentSocketId);
        studentSocket?.emit('perk-updated', {
          success: true,
          message: result.message,
          data: result.data,
        });
      }

      // Confirm to teacher
      client.emit('perk-action-confirmation', {
        success: true,
        message: result.message,
        action: dto.action,
        data: result.data,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error managing perk: ${errorMsg}`);
      client.emit('ws-error', {
        success: false,
        message: errorMsg || 'Failed to manage perk',
      });

      // Also emit failure confirmation to teacher so UI can revert if needed
      client.emit('perk-action-confirmation', {
        success: false,
        message: errorMsg || 'Failed to manage perk',
        action: dto.action,
        error: errorMsg,
      });
    }
  }

  @SubscribeMessage('update-skills-status')
  async handleSkillsStatusUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { classId: string; studentId?: string },
  ) {
    this.logger.log(
      `[${client.data.type || 'unknown'}] ${client.id} -> update-skills-status with payload: ${JSON.stringify(
        dto,
      )}`,
    );

    try {
      if (dto.studentId) {
        // Individual student toggle
        const enrollment: Enrollment = await this.resuable.checkEnrollment(
          dto.classId,
          dto.studentId,
        );

        // Toggle the skill status
        const updatedStatus = await this.skillsService.toggleSkillStatus(
          enrollment.enrolledStudent.id,
        );

        const response = {
          success: true,
          message: `Skills status updated for ${enrollment.user.name}.`,
          data: {
            studentId: enrollment.user.id,
            name: enrollment.user.name,
            skill_unlocked: updatedStatus.skill_unlocked,
          },
        };

        this.logger.log(`Emitting skills-status-updated for student: ${JSON.stringify(response)}`);
        this.server.to(dto.classId).emit('skills-status-updated', response);
      } else {
        // Class-wide toggle
        const result = await this.skillsService.toggleClassSkillStatus(dto.classId);

        const response = {
          success: true,
          message: `All students skill status toggled to ${result.skill_unlocked ? 'unlocked' : 'locked'}.`,
          data: {
            skill_unlocked: result.skill_unlocked,
          },
        };

        this.logger.log(`Emitting skills-status-updated for class: ${JSON.stringify(response)}`);
        this.server.to(dto.classId).emit('skills-status-updated', response);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error updating skills status: ${errorMsg}`);
      client.emit('ws-error', {
        success: false,
        message: errorMsg || 'Failed to update skills status',
      });
    }
  }

  // ==================== REVERED ICON - PERK CANCELLATION ====================

  @SubscribeMessage('revered-icon-cancel')
  async handleReveredIconCancel(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    dto: {
      classId: string;
      commanderId: string;
      pendingPerkKey: string; // Format: "classId:rivalStudentId:perkId"
    },
  ) {
    this.logger.log(
      `[${client.data.type || 'unknown'}] ${client.id} -> revered-icon-cancel with payload: ${JSON.stringify(dto)}`,
    );

    try {
      const pendingActivation = this.pendingPerkActivations.get(dto.pendingPerkKey);

      if (!pendingActivation) {
        client.emit('revered-icon-cancel-result', {
          success: false,
          message: 'Perk activation has already completed or was not found.',
        });
        return;
      }

      // Verify the commander is the one who can cancel
      if (pendingActivation.commanderId !== dto.commanderId) {
        client.emit('revered-icon-cancel-result', {
          success: false,
          message: 'You are not authorized to cancel this perk.',
        });
        return;
      }

      // Clear the timeout
      clearTimeout(pendingActivation.timeout);

      // Cancel the rival's perk using ReveredIcon
      // Get commander enrollment ID for proper logging
      const commanderEnrollment = await this.prismaService.enrolled_students.findFirst({
        where: { student_id: pendingActivation.commanderId, class_id: dto.classId },
      });

      await ReveredIcon.cancelRivalPerk(
        this.prismaService,
        pendingActivation.reveredIconPerkId,
        commanderEnrollment?.id ?? pendingActivation.commanderId,
        pendingActivation.perkId,
        pendingActivation.studentName,
        pendingActivation.perkTitle,
      );

      // Remove from pending
      this.pendingPerkActivations.delete(dto.pendingPerkKey);

      // Reject the activation (this will prevent the perk from executing)
      pendingActivation.rejectActivation('Cancelled by Revered Icon');

      // Notify the Commander
      client.emit('revered-icon-cancel-result', {
        success: true,
        message: `You used Revered Icon to cancel ${pendingActivation.studentName}'s ${pendingActivation.perkTitle}!`,
        data: {
          cancelledPerk: pendingActivation.perkTitle,
          cancelledRival: pendingActivation.studentName,
        },
      });

      // Notify the rival that their perk was cancelled
      const rivalSocketId = this.studentSocketMap.get(pendingActivation.studentId);
      if (rivalSocketId) {
        const rivalSocket = this.server.sockets.sockets.get(rivalSocketId);
        rivalSocket?.emit('perk-cancelled-by-commander', {
          success: false,
          message: `Your ${pendingActivation.perkTitle} was cancelled by ${pendingActivation.commanderName} using Revered Icon!`,
          data: {
            perkId: pendingActivation.perkId,
            perkTitle: pendingActivation.perkTitle,
            cancelledBy: pendingActivation.commanderName,
          },
        });
      }

      // Broadcast to class
      this.server.to(dto.classId).emit('perk-cancelled-announcement', {
        success: true,
        message: `${pendingActivation.commanderName} used Revered Icon to cancel ${pendingActivation.studentName}'s ${pendingActivation.perkTitle}!`,
        data: {
          commander: pendingActivation.commanderName,
          rival: pendingActivation.studentName,
          perk: pendingActivation.perkTitle,
          rivalStudentId: pendingActivation.studentId,
          rivalPerkId: pendingActivation.perkId,
        },
      });

      this.logger.log(
        `Revered Icon: ${pendingActivation.commanderName} cancelled ${pendingActivation.studentName}'s ${pendingActivation.perkTitle}`,
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error handling Revered Icon cancel: ${errorMsg}`);
      client.emit('revered-icon-cancel-result', {
        success: false,
        message: errorMsg || 'Failed to cancel perk',
      });
    }
  }

  /**
   * Helper method to check for Revered Icon and create a pending activation
   * Returns true if there's a Commander who can cancel, false otherwise
   */
  async checkAndNotifyReveredIcon(
    classId: string,
    studentId: string,
    studentName: string,
    perkId: string,
    perkTitle: string,
  ): Promise<{
    hasPending: boolean;
    pendingKey?: string;
    waitForCancel?: Promise<void>;
  }> {
    // Check if there's a Commander with Revered Icon
    const commanderInfo = await ReveredIcon.findAvailableReveredIcon(
      this.prismaService,
      classId,
      studentId,
    );

    if (!commanderInfo) {
      return { hasPending: false };
    }

    const pendingKey = `${classId}:${studentId}:${perkId}`;

    // Create a promise that resolves when the activation should proceed
    // or rejects if cancelled
    let resolveActivation!: () => void;
    let rejectActivation!: (reason: string) => void;

    const waitForCancel = new Promise<void>((resolve, reject) => {
      resolveActivation = resolve;
      rejectActivation = reject;
    });

    // Set timeout - if not cancelled within window, proceed with activation
    const timeout = setTimeout(() => {
      const pending = this.pendingPerkActivations.get(pendingKey);
      if (pending) {
        this.pendingPerkActivations.delete(pendingKey);
        resolveActivation(); // Allow activation to proceed

        // Notify Commander that time expired
        const commanderSocketId = this.studentSocketMap.get(commanderInfo.commanderId);
        if (commanderSocketId) {
          const commanderSocket = this.server.sockets.sockets.get(commanderSocketId);
          commanderSocket?.emit('revered-icon-expired', {
            success: true,
            message: `Time expired! ${studentName}'s ${perkTitle} has been activated.`,
            data: { pendingKey },
          });
        }
      }
    }, ReveredIcon.CANCEL_WINDOW_MS);

    // Store the pending activation
    // Need to get commanderEnrollmentId for proper perk usage logging
    const commanderEnrollment = await this.prismaService.enrolled_students.findFirst({
      where: { student_id: commanderInfo.commanderId, class_id: classId },
    });

    this.pendingPerkActivations.set(pendingKey, {
      classId,
      studentId,
      studentName,
      perkId,
      perkTitle,
      commanderId: commanderInfo.commanderId,
      commanderName: commanderInfo.commanderName,
      reveredIconPerkId: commanderInfo.reveredIconPerkId,
      timeout,
      resolveActivation,
      rejectActivation,
    });

    // Update the pending activation with correct enrollment ID
    const pendingActivation = this.pendingPerkActivations.get(pendingKey);
    if (pendingActivation && commanderEnrollment) {
      // Store enrollment ID for logging
      (
        pendingActivation as PendingPerkActivation & { commanderEnrollmentId?: string }
      ).commanderEnrollmentId = commanderEnrollment.id;
    }

    // Notify the Commander about the pending perk
    const commanderSocketId = this.studentSocketMap.get(commanderInfo.commanderId);
    if (commanderSocketId) {
      const commanderSocket = this.server.sockets.sockets.get(commanderSocketId);
      commanderSocket?.emit('rival-perk-pending', {
        success: true,
        message: `${studentName} is activating ${perkTitle}! You have ${ReveredIcon.CANCEL_WINDOW_MS / 1000} seconds to cancel with Revered Icon.`,
        data: {
          pendingKey,
          rival: {
            id: studentId,
            name: studentName,
          },
          perk: {
            id: perkId,
            title: perkTitle,
          },
          cancelWindowMs: ReveredIcon.CANCEL_WINDOW_MS,
          expiresAt: Date.now() + ReveredIcon.CANCEL_WINDOW_MS,
        },
      });
    }

    this.logger.log(
      `Revered Icon check: Commander ${commanderInfo.commanderName} notified about ${studentName}'s ${perkTitle}`,
    );

    return { hasPending: true, pendingKey, waitForCancel };
  }

  /**
   * Checks whether `victimStudentId` has Fan the Flames available and, if
   * so, offers them a live window to redirect an incoming MS loss to another
   * player. Called from inside each MS-loss-causing perk (Trendsetter,
   * Star Power, Danger Zone, Double Down) right before it would otherwise
   * decrement the victim's market_share.
   *
   * Resolves to whichever enrollment should actually take the loss — the
   * original victim if they don't have the perk, don't respond in time, or
   * decline, otherwise their chosen target.
   */
  async checkAndOfferFanTheFlames(
    classId: string,
    victimStudentId: string,
    victimEnrollmentId: string,
    amount: number,
    sourcePerkTitle: string,
    attackerName: string,
  ): Promise<{
    finalTargetEnrollmentId: string;
    finalTargetStudentId: string;
    wasRedirected: boolean;
  }> {
    const noRedirect = {
      finalTargetEnrollmentId: victimEnrollmentId,
      finalTargetStudentId: victimStudentId,
      wasRedirected: false,
    };

    const available = await FanTheFlames.findAvailable(this.prismaService, victimEnrollmentId);
    if (!available) {
      return noRedirect;
    }
    const victimSocketId = this.studentSocketMap.get(victimStudentId);
    if (!victimSocketId) {
      return noRedirect;
    }
    const victimSocket = this.server.sockets.sockets.get(victimSocketId);
    if (!victimSocket) {
      return noRedirect;
    }

    const rivals = await this.prismaService.enrolled_students.findMany({
      where: {
        class_id: classId,
        student_id: { not: victimStudentId },
        is_cancelled: { not: true },
      },
      select: {
        student_id: true,
        market_share: true,
        users: { select: { name: true } },
      },
    });

    if (rivals.length === 0) {
      return noRedirect;
    }

    const pendingKey = `${classId}:${victimStudentId}:${Date.now()}`;

    let resolveDecision!: (result: {
      enrollmentId: string;
      studentId: string;
      redirected: boolean;
    }) => void;
    const decision = new Promise<{ enrollmentId: string; studentId: string; redirected: boolean }>(
      (resolve) => {
        resolveDecision = resolve;
      },
    );

    const timeout = setTimeout(() => {
      const pending = this.pendingFanTheFlamesDecisions.get(pendingKey);
      if (pending) {
        this.pendingFanTheFlamesDecisions.delete(pendingKey);
        pending.resolveDecision({
          enrollmentId: victimEnrollmentId,
          studentId: victimStudentId,
          redirected: false,
        });

        this.server.to(victimSocketId).emit('fan-the-flames-expired', {
          success: true,
          message: `Time expired — you took the ${amount} MS loss from ${sourcePerkTitle}.`,
          data: { pendingKey },
        });
      }
    }, FanTheFlames.DECISION_WINDOW_MS);

    this.pendingFanTheFlamesDecisions.set(pendingKey, {
      classId,
      victimStudentId,
      victimEnrollmentId,
      fanTheFlamesPerkId: available.studentPerkId,
      amount,
      sourcePerkTitle,
      attackerName,
      timeout,
      resolveDecision,
    });

    victimSocket.emit('fan-the-flames-offer', {
      success: true,
      message: `${attackerName}'s ${sourcePerkTitle} would cost you ${amount} MS! You have ${FanTheFlames.DECISION_WINDOW_MS / 1000}s to redirect it to another player.`,
      data: {
        pendingKey,
        amount,
        sourcePerkTitle,
        attackerName,
        rivals: rivals.map((r) => ({
          id: r.student_id,
          name: r.users?.name ?? 'Unknown',
          marketShare: r.market_share ?? 0,
        })),
        decisionWindowMs: FanTheFlames.DECISION_WINDOW_MS,
        expiresAt: Date.now() + FanTheFlames.DECISION_WINDOW_MS,
      },
    });

    this.logger.log(
      `Fan the Flames: offered ${victimStudentId} a redirect for ${amount} MS from ${sourcePerkTitle}`,
    );

    const result = await decision;

    return {
      finalTargetEnrollmentId: result.enrollmentId,
      finalTargetStudentId: result.studentId,
      wasRedirected: result.redirected,
    };
  }

  @SubscribeMessage('fan-the-flames-redirect')
  async handleFanTheFlamesRedirect(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    dto: {
      classId: string;
      pendingKey: string;
      targetStudentId: string;
    },
  ) {
    this.logger.log(
      `[${client.data.type || 'unknown'}] ${client.id} -> fan-the-flames-redirect with payload: ${JSON.stringify(dto)}`,
    );

    try {
      const pending = this.pendingFanTheFlamesDecisions.get(dto.pendingKey);

      if (!pending) {
        client.emit('fan-the-flames-redirect-result', {
          success: false,
          message: 'This decision has already expired or been resolved.',
        });
        return;
      }

      if (
        client.data.type !== 'student' ||
        client.data.studentId !== pending.victimStudentId ||
        dto.classId !== pending.classId
      ) {
        client.emit('fan-the-flames-redirect-result', {
          success: false,
          message: 'You are not authorized to resolve this decision.',
        });
        return;
      }

      const target = await this.prismaService.enrolled_students.findFirst({
        where: {
          class_id: pending.classId,
          student_id: { equals: dto.targetStudentId, not: pending.victimStudentId },
          is_cancelled: { not: true },
        },
        include: { users: { select: { name: true } } },
      });

      if (!target) {
        client.emit('fan-the-flames-redirect-result', {
          success: false,
          message: 'Selected player is not an eligible redirect target.',
        });
        return;
      }

      clearTimeout(pending.timeout);
      this.pendingFanTheFlamesDecisions.delete(dto.pendingKey);

      await FanTheFlames.markUsedAfterRedirect(this.prismaService, pending.fanTheFlamesPerkId);

      pending.resolveDecision({
        enrollmentId: target.id,
        studentId: dto.targetStudentId,
        redirected: true,
      });

      client.emit('fan-the-flames-redirect-result', {
        success: true,
        message: `You redirected the ${pending.amount} MS loss from ${pending.sourcePerkTitle} to ${target.users?.name ?? 'them'}!`,
        data: {
          redirectedTo: dto.targetStudentId,
          redirectedToName: target.users?.name,
          amount: pending.amount,
        },
      });

      const newVictimSocketId = this.studentSocketMap.get(dto.targetStudentId);
      if (newVictimSocketId) {
        this.server.to(newVictimSocketId).emit('fan-the-flames-redirected-to-you', {
          success: true,
          message: `Fan the Flames! You now take ${pending.amount} MS loss from ${pending.sourcePerkTitle} meant for someone else.`,
          data: { amount: pending.amount, sourcePerkTitle: pending.sourcePerkTitle },
        });
      }

      this.logger.log(
        `Fan the Flames: ${pending.victimStudentId} redirected ${pending.amount} MS loss to ${dto.targetStudentId}`,
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error handling Fan the Flames redirect: ${errorMsg}`);
      client.emit('fan-the-flames-redirect-result', {
        success: false,
        message: errorMsg || 'Failed to redirect MS loss',
      });
    }
  }
}
