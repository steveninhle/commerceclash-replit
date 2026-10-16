import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions } from 'express';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get<T>(key: string): T {
    const value = this.configService.get<T>(key);
    if (value === undefined) {
      throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
  }

  getOrDefault<T>(key: string, defaultValue: T): T {
    const value = this.configService.get<T>(key);
    return value === undefined ? defaultValue : value;
  }

  get port(): number {
    return this.getOrDefault<number>('PORT', 4000);
  }

  get frontendUrl(): string {
    return this.get<string>('FRONTEND_URL');
  }
  get environment(): string {
    return this.getOrDefault<string>('NODE_ENV', 'development');
  }

  get isProduction(): boolean {
    return this.environment === 'production';
  }

  get jwtSecret(): string {
    return this.get<string>('JWT_SECRET');
  }

  get jwtExpiresIn(): number {
    return this.getOrDefault<number>('JWT_EXPIRES_IN', 3600);
  }

  get zoomClientIdServerToServer(): string {
    return this.get<string>('ZOOM_CLIENT_ID_STS');
  }
  get zoomClientSecretServerToServer(): string {
    return this.get<string>('ZOOM_CLIENT_SECRET_STS');
  }
  get zoomClientId(): string {
    return this.get<string>('ZOOM_CLIENT_ID');
  }
  get zoomClientSecret(): string {
    return this.get<string>('ZOOM_CLIENT_SECRET');
  }
  get zoomAccountIdServerToServer(): string {
    return this.get<string>('ZOOM_ACCOUNT_ID_STS');
  }
  get zoomApiBaseUrl(): string {
    return this.get<string>('ZOOM_API_BASE_URL');
  }
  get zoomOAuthEndpoint(): string {
    return this.get<string>('ZOOM_OAUTH_ENDPOINT');
  }

  get zoomDefaultHostUserId(): string {
    return this.get<string>('ZOOM_DEFAULT_HOST_USER_ID');
  }

  get stripeSecretKey(): string {
    return this.get<string>('STRIPE_SECRET_KEY');
  }

  get stripeWebhookSecret(): string {
    return this.get<string>('STRIPE_WEBHOOK_SECRET');
  }

  get resendApiKey(): string {
    return this.get<string>('RESEND_API_KEY');
  }

  get resendFromEmail(): string {
    return this.get<string>('RESEND_FROM_EMAIL');
  }

  getCookieOptions(maxAge: number = 3 * 60 * 60 * 1000): CookieOptions {
    return {
      httpOnly: true,
      maxAge,
      secure: true,
      sameSite: this.environment === 'development' ? 'none' : 'lax',
      path: '/',
    };
  }
  getZakCookieOptions(maxAge: number = 2 * 60 * 60 * 1000): CookieOptions {
    return {
      httpOnly: true,
      maxAge,
      secure: true,
      sameSite: 'none',
      path: '/',
    };
  }
}
