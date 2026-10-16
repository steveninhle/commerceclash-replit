import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../utils/supabase/supabase.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { AuthResponseApiDto, PublicUserDto } from './dto/auth-response.dto';
import { UsersService } from '../user/users.service';
import { CookieOptions, Request as ExpressRequest, Response } from 'express';
import { AppConfigService } from '@utils/config/config.service';
import { PrismaService } from '@utils/prisma/prisma.service';
import { ApiResponse } from '@utils/common/interfaces/interfaces';
import { SetSessionDto } from './dto/set-session.dto';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly frontendUrl: string;
  private readonly cookieOptions: CookieOptions;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
    private readonly configService: AppConfigService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {
    this.frontendUrl = this.configService.frontendUrl;
    this.cookieOptions = this.configService.getCookieOptions();
  }

  async signUp(signUpDto: SignUpDto): Promise<AuthResponseApiDto> {
    try {
      const existingUser = await this.usersService.findByEmail(signUpDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const response = await this.supabaseService.signUp(signUpDto.email, signUpDto.password, {
        data: {
          firstName: signUpDto.firstName,
          lastName: signUpDto.lastName,
          fullName: `${signUpDto.firstName} ${signUpDto.lastName}`,
        },
      });

      if (response.error) {
        this.logger.error(`Supabase DB signup error: ${response.error.message}`);
        throw new InternalServerErrorException({
          success: false,
          message: `Supabase DB signup failed: ${response.error.message}`,
        });
      }

      if (!response.data.user) {
        throw new InternalServerErrorException({
          success: false,
          message: 'Failed to create user account',
        });
      }

      const defaultRole = await this.prisma.users.findFirst({
        where: { id: response.data.user.id },
        include: { roles: true },
      });
      if (!defaultRole) {
        throw new InternalServerErrorException({
          success: false,
          message: 'Student User role not found',
        });
      }

      const fullName = (response.data.user.user_metadata as { fullName?: string })?.fullName;

      const publicUser: PublicUserDto = {
        id: response.data.user.id,
        email: response.data.user.email ?? '',
        name: fullName ?? undefined,
        role: defaultRole.roles.name,
        is_active: defaultRole.is_active,
        created_at: new Date(),
        updated_at: new Date(),
      };

      return {
        success: true,
        message: 'User created successfully',
        data: { user: publicUser },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Signup error: ${errorMessage}`);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException({
        success: false,
        message: 'An unexpected error occurred during signup',
        error: errorMessage,
      });
    }
  }

  async signIn(signInDto: SignInDto, res: Response): Promise<AuthResponseApiDto> {
    try {
      const response = await this.supabaseService.signIn(signInDto.email, signInDto.password);

      if (response.error || !response.data.user || !response.data.session) {
        this.logger.error(`Supabase signin error: ${response.error?.message}`);
        throw new UnauthorizedException({
          success: false,
          message: 'Invalid user credentials',
          error: response.error?.message ?? 'Authentication failed',
        });
      }

      const userWithRole = await this.prisma.users.findFirst({
        where: { email: { equals: signInDto.email, mode: 'insensitive' } },
        include: { roles: true },
      });

      if (!userWithRole) {
        throw new NotFoundException({
          success: false,
          message: 'User not found in database',
          error: 'User not found',
        });
      }

      res.cookie('access_token', response.data.session.access_token, this.cookieOptions);
      res.cookie('refresh_token', response.data.session.refresh_token, this.cookieOptions);

      const publicUser: PublicUserDto & { role?: string } = {
        id: userWithRole.id,
        email: userWithRole.email,
        name: userWithRole.name ?? undefined,
        role: userWithRole.roles.name,
        is_active: userWithRole.is_active,
        created_at: userWithRole.created_at,
        updated_at: userWithRole.updated_at,
      };
      if (publicUser.is_active === false) {
        throw new UnauthorizedException({
          success: false,
          message: 'User is set inactive by teacher',
          error: 'User is set inactive by teacher',
        });
      }

      return {
        success: true,
        message: 'User logged in successfully',
        data: {
          access_token: response.data.session.access_token,
          refresh_token: response.data.session.refresh_token,
          user: publicUser,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Signin error: ${errorMessage}`);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException({
        success: false,
        message: 'An unexpected error occurred during signin',
        error: errorMessage,
      });
    }
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    if (!email) {
      throw new BadRequestException({
        success: false,
        message: 'Email is required',
      });
    }

    try {
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        throw new Error('User not found');
      }
      const supabase = this.supabaseService.getPublicClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${this.frontendUrl}/reset-password`,
      });
      if (error) {
        throw new Error(error.message);
      }
      return {
        success: true,
        message: 'Password reset email has been sent.',
        data: null,
      };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));

      this.logger.error(`ForgotPassword error: ${error.message}`, error.stack);
      if (error.message === 'User not found') {
        throw new BadRequestException({
          success: false,
          message: 'User does not exist',
        });
      }
      throw new InternalServerErrorException({
        success: false,
        message: 'An unexpected error occurred while processing your request.',
        error: error.message,
      });
    }
  }

  setSession(body: SetSessionDto, res: Response): ApiResponse {
    try {
      if (!body.accessToken || !body.refreshToken) {
        throw new BadRequestException({
          success: false,
          message: 'Both accessToken and refreshToken are required',
        });
      }

      res.cookie('access_token', body.accessToken, this.cookieOptions);
      res.cookie('refresh_token', body.refreshToken, this.cookieOptions);

      return { success: true, message: 'Session set successfully' };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;

      this.logger.error(
        `Unexpected setSession error: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'An unexpected error occurred while setting session cookies.',
      });
    }
  }

  async verifyRecoveryToken(token: string, res: Response): Promise<ApiResponse> {
    try {
      const session = await this.supabaseService.verifyRecoveryToken(token);
      res.cookie('access_token', session.access_token, this.cookieOptions);
      res.cookie('refresh_token', session.refresh_token, this.cookieOptions);
      return { success: true, message: 'Recovery link verified' };
    } catch (err) {
      this.logger.warn(
        `verifyRecoveryToken failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new BadRequestException({
        success: false,
        message: 'Invalid or expired link',
      });
    }
  }

  // Mints and emails a fresh set-password link — used when a user's
  // original link (from Stripe registration) has expired. Always returns a
  // generic success message regardless of whether the email is registered,
  // so this endpoint can't be used to enumerate accounts.
  async resendSetPasswordLink(email: string): Promise<ApiResponse> {
    if (!email) {
      throw new BadRequestException({ success: false, message: 'Email is required' });
    }

    const genericResponse: ApiResponse = {
      success: true,
      message: 'If an account exists for this email, a new set-password link has been sent.',
    };

    const normalizedEmail = email.trim().toLowerCase();
    const localUser = await this.prisma.users.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });
    if (!localUser) {
      return genericResponse;
    }

    // Only resend a link for accounts a completed payment actually created.
    // cohort_students rows are only ever written inside fulfillRegistration
    // after a Stripe webhook marks the payment complete, so having at least
    // one is a reliable proxy for "payment status completed" without
    // parsing the raw Stripe event payload.
    const hasCompletedEnrollment = await this.prisma.cohort_students.findFirst({
      where: { student_id: localUser.id },
      select: { id: true },
    });
    if (!hasCompletedEnrollment) {
      return genericResponse;
    }

    const { hashedToken } = await this.supabaseService.adminGenerateRecoveryToken(localUser.email);
    const link = `${this.frontendUrl}/set-password?token=${hashedToken}&type=recovery`;
    await this.emailService.sendSetPasswordEmail(
      localUser.email,
      link,
      localUser.name ?? undefined,
    );

    return genericResponse;
  }

  async resetPassword(newPassword: string, req?: ExpressRequest): Promise<ApiResponse> {
    return this.updatePassword(newPassword, req, 'Password reset successfully');
  }

  async setPassword(newPassword: string, req?: ExpressRequest): Promise<ApiResponse> {
    return this.updatePassword(newPassword, req, 'Password set successfully');
  }

  private async updatePassword(
    newPassword: string,
    req: ExpressRequest | undefined,
    successMessage: string,
  ): Promise<ApiResponse> {
    if (!newPassword) {
      throw new BadRequestException({
        success: false,
        message: 'New password is required',
      });
    }

    const cookies = (req?.cookies ?? {}) as Record<string, unknown>;
    const access =
      typeof cookies['access_token'] === 'string' ? cookies['access_token'] : undefined;
    const refresh =
      typeof cookies['refresh_token'] === 'string' ? cookies['refresh_token'] : undefined;

    if (!access || !refresh) {
      throw new UnauthorizedException({
        success: false,
        message: 'No active recovery session. Please use the link from your email again.',
      });
    }

    try {
      let userId: string;
      try {
        const result = await this.supabaseService.updateUserPasswordWithSession(
          access,
          refresh,
          newPassword,
        );
        userId = result.id;
      } catch (err) {
        this.logger.warn(
          `Failed to update password from recovery session: ${err instanceof Error ? err.message : String(err)}`,
        );
        throw new BadRequestException({
          success: false,
          message: `Failed to reset password: ${err instanceof Error ? err.message : String(err)}`,
        });
      }

      const getPublicUser = await this.prisma.users.findUnique({
        where: { id: userId },
        include: { roles: true },
      });

      if (!getPublicUser) {
        throw new InternalServerErrorException({
          success: false,
          message: 'User not found in database after password update.',
        });
      }

      const publicUser: PublicUserDto = {
        id: getPublicUser.id,
        email: getPublicUser.email,
        name: getPublicUser.name ?? undefined,
        role: getPublicUser.roles.name,
        is_active: getPublicUser.is_active,
        created_at: getPublicUser.created_at,
        updated_at: getPublicUser.updated_at,
      };

      return {
        success: true,
        message: successMessage,
        data: publicUser ?? null,
      };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof UnauthorizedException) {
        throw err;
      }
      this.logger.error(
        `Unexpected updatePassword error: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'An unexpected error occurred while updating the password.',
      });
    }
  }

  async refreshToken(refreshToken: string, res: Response): Promise<ApiResponse> {
    if (!refreshToken) {
      throw new BadRequestException({
        success: false,
        message: 'Refresh token is required',
      });
    }

    try {
      let session: { access_token: string; refresh_token: string } | null;
      try {
        session = await this.supabaseService.refreshSession(refreshToken);
      } catch (err) {
        this.logger.warn(
          `Supabase refreshToken error: ${err instanceof Error ? err.message : String(err)}`,
        );
        throw new UnauthorizedException({
          success: false,
          message: `Failed to refresh token: ${err instanceof Error ? err.message : String(err)}`,
        });
      }

      if (!session) {
        return {
          success: false,
          message: 'No session returned from Supabase.',
        };
      }
      res.cookie('access_token', session.access_token, this.cookieOptions);
      res.cookie('refresh_token', session.refresh_token, this.cookieOptions);

      return {
        success: true,
        message: 'Session refreshed successfully',
      };
    } catch (err) {
      this.logger.error(
        `Unexpected refreshToken error: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'An unexpected error occurred while refreshing the token.',
      });
    }
  }

  async signOut(
    res: Response,
    token?: string,
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const { error } = await this.supabaseService.signOut('local', token);

      if (error) {
        this.logger.error(`Supabase signout error: ${error.message}`);
        throw new UnauthorizedException({
          success: false,
          message: 'Failed to sign out',
          error: error.message,
        });
      }

      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      return {
        success: true,
        message: 'Successfully signed out',
      };
    } catch (err) {
      this.logger.error(
        `Unexpected signOut error: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new InternalServerErrorException({
        success: false,
        message: 'An unexpected error occurred during signout',
      });
    }
  }

  async deleteAccount(
    userId: string,
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      await Promise.all([
        this.usersService.remove(userId),
        this.supabaseService.signOut(),
        this.supabaseService.deleteUser(userId),
      ]);

      return {
        success: true,
        message: 'Account successfully deleted',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Delete account error: ${errorMessage}`);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to delete account',
        error: errorMessage,
      });
    }
  }
}
