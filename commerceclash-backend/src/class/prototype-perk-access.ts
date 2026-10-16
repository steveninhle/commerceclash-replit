import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@utils/prisma/prisma.service';
import { SupabaseService } from '@utils/supabase/supabase.service';
import cookieParser from 'cookie-parser';
import { Request, Response } from 'express';
import { Socket } from 'socket.io';

@Injectable()
export class PrototypePerkAccess {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  private requireEnabled() {
    if (process.env.NODE_ENV !== 'development' || process.env.ENABLE_PROTOTYPE_PERKS !== 'true') {
      throw new ForbiddenException('Prototype perk events are disabled.');
    }
  }

  async student(client: Socket, classId: string, studentId: string, prototype = true) {
    if (prototype) this.requireEnabled();
    const userId = await this.identity(client);
    if (userId !== studentId)
      throw new ForbiddenException('Cannot trigger perks for another student.');
    const enrollment = await this.prisma.enrolled_students.findFirst({
      where: { class_id: classId, student_id: userId, is_cancelled: { not: true } },
    });
    if (!enrollment) throw new ForbiddenException('Student is not enrolled in this class.');
  }

  async teacher(client: Socket, classId: string, prototype = true) {
    if (prototype) this.requireEnabled();
    const userId = await this.identity(client);
    const classroom = await this.prisma.renamedclass.findUnique({ where: { id: classId } });
    if (!classroom || classroom.instructor_id !== userId) {
      throw new ForbiddenException('Only the class instructor can perform this action.');
    }
  }

  private async identity(client: Socket) {
    const request = client.request as Request;
    cookieParser()(request, {} as Response, () => undefined);
    const cookies = request.cookies as Record<string, unknown>;
    const auth = client.handshake.auth as Record<string, unknown>;
    const token = auth?.accessToken ?? cookies?.access_token;
    if (typeof token !== 'string' || !token)
      throw new UnauthorizedException('A session is required.');
    const { data, error } = await this.supabase.getPublicClient().auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Invalid session.');
    return data.user.id;
  }
}
