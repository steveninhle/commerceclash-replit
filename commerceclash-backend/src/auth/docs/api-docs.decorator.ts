import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { SignInDto } from '../dto/sign-in.dto';
import { SetSessionDto } from '../dto/set-session.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyRecoveryTokenDto } from '../dto/verify-recovery-token.dto';
import { ResendSetPasswordDto } from '../dto/resend-set-password.dto';

export function ApiSignIn() {
  return applyDecorators(
    ApiOperation({ summary: 'Sign in with email and password' }),
    ApiBody({ type: SignInDto }),
    ApiResponse({
      status: 200,
      description: 'User successfully authenticated',
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid credentials',
    }),
  );
}

export function ApiForgotPassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Send a password reset email with redirect link' }),
    ApiBody({
      type: ForgotPasswordDto,
    }),
    ApiResponse({
      status: 200,
      description: 'Password reset email sent successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Email is required',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
    }),
  );
}

export function ApiResendSetPassword() {
  return applyDecorators(
    ApiOperation({
      summary: 'Resend a set-password link for an expired/invalid one',
    }),
    ApiBody({ type: ResendSetPasswordDto }),
    ApiResponse({
      status: 200,
      description:
        'Generic success response — sent regardless of whether the email is registered, to avoid leaking account existence',
      schema: {
        example: {
          success: true,
          message: 'If an account exists for this email, a new set-password link has been sent.',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Email is required',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
    }),
  );
}

export function ApiSetSession() {
  return applyDecorators(
    ApiOperation({ summary: 'Set Supabase session cookies' }),
    ApiBody({ type: SetSessionDto }),
    ApiResponse({
      status: 200,
      description: 'Session cookies set successfully',
      schema: {
        example: {
          success: true,
          message: 'Session set successfully',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid or missing session tokens',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
    }),
  );
}

export function ApiVerifyRecoveryToken() {
  return applyDecorators(
    ApiOperation({ summary: 'Verify a recovery token_hash and set session cookies' }),
    ApiBody({ type: VerifyRecoveryTokenDto }),
    ApiResponse({
      status: 200,
      description: 'Recovery link verified, session cookies set',
      schema: {
        example: {
          success: true,
          message: 'Recovery link verified',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid or expired link',
    }),
  );
}

export function ApiResetPassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Reset the password for a user' }),
    ApiBody({
      type: ResetPasswordDto,
    }),
    ApiResponse({
      status: 200,
      description: 'Password reset successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'New password is required',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
    }),
  );
}

export function ApiSetPassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Set the password for a user from a set-password email link' }),
    ApiBody({
      type: ResetPasswordDto,
    }),
    ApiResponse({
      status: 200,
      description: 'Password set successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'New password is required',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
    }),
  );
}

export function ApiRefreshToken() {
  return applyDecorators(
    ApiOperation({ summary: 'Refresh an expired access token using refresh token' }),
    ApiResponse({
      status: 200,
      description: 'Session refreshed successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Refresh token is required',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
    }),
  );
}

export function ApiSignOut() {
  return applyDecorators(
    ApiOperation({ summary: 'Sign out current user' }),
    ApiCookieAuth(),
    ApiResponse({
      status: 200,
      description: 'User successfully signed out',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
  );
}

export function ApiDeleteAccount() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete user account' }),
    ApiCookieAuth(),
    ApiResponse({
      status: 200,
      description: 'Account successfully deleted',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
  );
}
