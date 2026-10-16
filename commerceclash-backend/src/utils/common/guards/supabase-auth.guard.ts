import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseClient, AuthTokenResponse, Session } from '@supabase/supabase-js';
import { SupabaseService } from '@utils/supabase/supabase.service';
import { PrismaService } from '@utils/prisma/prisma.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: any;
  complete_user?: AuthTokenResponse['data'];
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private supabase: SupabaseClient;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
  ) {
    this.supabase = this.supabaseService.getPublicClient();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const cookies = request.cookies as Record<string, string> | undefined;
    const token = cookies?.['access_token'];

    return this.cookieValidation(token, request as AuthenticatedRequest);
  }

  private async cookieValidation(
    token: string | undefined,
    request: AuthenticatedRequest,
  ): Promise<boolean> {
    if (!token) {
      throw new UnauthorizedException('No access token provided');
    }

    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data?.user) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    const supabaseUser = data.user;

    const localUser = await this.prisma.users.findUnique({
      where: { id: supabaseUser.id },
      include: { roles: true },
    });

    if (!localUser) {
      throw new UnauthorizedException('User not found in application database');
    }

    request.user = {
      ...supabaseUser,
      ...localUser,
      role: localUser.roles?.name,
    };

    const session: Session = {
      access_token: token,
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: '',
      user: supabaseUser,
    };

    request.complete_user = {
      user: supabaseUser,
      session,
    };

    return true;
  }
}
