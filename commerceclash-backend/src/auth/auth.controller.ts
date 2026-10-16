import { Controller, Post, Body, HttpCode, HttpStatus, Req, Delete, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest, Response } from 'express';
import { User } from '@supabase/supabase-js';

interface AuthenticatedRequest extends ExpressRequest {
  user: User;
  cookies: Record<string, string>;
}
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import {
  ApiSignIn,
  ApiSignOut,
  ApiDeleteAccount,
  ApiRefreshToken,
  ApiResetPassword,
  ApiSetPassword,
  ApiForgotPassword,
  ApiSetSession,
  ApiVerifyRecoveryToken,
  ApiResendSetPassword,
} from './docs/api-docs.decorator';
import { Auth } from '../utils/common/decorators/auth.decorator';
import { ApiResponse } from '@utils/common/interfaces/interfaces';
import { SetSessionDto } from './dto/set-session.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyRecoveryTokenDto } from './dto/verify-recovery-token.dto';
import { ResendSetPasswordDto } from './dto/resend-set-password.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  @ApiSignIn()
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.signIn(signInDto, res);
  }

  @Post('forgot-password')
  @ApiForgotPassword()
  async forgotPassword(@Body() ForgotPasswordDto: ForgotPasswordDto): Promise<ApiResponse> {
    return this.authService.forgotPassword(ForgotPasswordDto.email);
  }

  @Post('set-session')
  @ApiSetSession()
  setSession(@Body() body: SetSessionDto, @Res({ passthrough: true }) res: Response): ApiResponse {
    return this.authService.setSession(body, res);
  }

  @Post('verify-recovery-token')
  @ApiVerifyRecoveryToken()
  async verifyRecoveryToken(
    @Body() verifyRecoveryTokenDto: VerifyRecoveryTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse> {
    return this.authService.verifyRecoveryToken(verifyRecoveryTokenDto.token, res);
  }

  @Post('resend-set-password')
  @ApiResendSetPassword()
  async resendSetPassword(
    @Body() resendSetPasswordDto: ResendSetPasswordDto,
  ): Promise<ApiResponse> {
    return this.authService.resendSetPasswordLink(resendSetPasswordDto.email);
  }

  @Post('reset-password')
  @ApiResetPassword()
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: ExpressRequest,
  ): Promise<ApiResponse> {
    return this.authService.resetPassword(resetPasswordDto.newPassword, req);
  }

  @Post('set-password')
  @ApiSetPassword()
  async setPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: ExpressRequest,
  ): Promise<ApiResponse> {
    return this.authService.setPassword(resetPasswordDto.newPassword, req);
  }

  @Post('refresh-token')
  @ApiRefreshToken()
  async refreshToken(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse> {
    const token = req.cookies['refresh_token'] as string;

    return this.authService.refreshToken(token, res);
  }

  @Post('signout')
  @Auth()
  @ApiSignOut()
  @HttpCode(HttpStatus.OK)
  async signOut(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies['access_token'] as string;
    return this.authService.signOut(res, token);
  }

  @Delete('account')
  @Auth()
  @ApiDeleteAccount()
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@Req() req: AuthenticatedRequest) {
    return this.authService.deleteAccount(req.user.id);
  }
}
