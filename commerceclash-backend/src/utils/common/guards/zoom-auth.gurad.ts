import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AppConfigService } from '@utils/config/config.service';
import axios from 'axios';
import { Request, Response } from 'express';

export interface ZoomUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  type: number;
  role_name?: string;
  pmi?: number;
  use_pmi?: boolean;
  personal_meeting_url?: string;
  timezone?: string;
  verified?: number;
  dept?: string;
  created_at?: string;
  last_login_time?: string;
  last_client_version?: string;
  pic_url?: string;
  language?: string;
  phone_number?: string;
  status?: string;
  job_title?: string;
  location?: string;
  login_types?: number[];
  account_id?: string;
  host_key?: string;
  group_ids?: string[];
  im_group_ids?: string[];
  cms_user_id?: string;
  jid?: string;
}

export interface ZoomRequest extends Request {
  zoomUser: ZoomUser;
  zoomToken?: string;
  zoomZakToken: string;
  expiresIn: number;
}

interface ZoomOAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

@Injectable()
export class ZoomAuthGuard implements CanActivate {
  private readonly apiBaseUrl: string;
  private readonly oauthEndpoint: string;
  private readonly accountId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  private readonly logger = new Logger(ZoomAuthGuard.name);

  constructor(private readonly config: AppConfigService) {
    this.apiBaseUrl = this.config.zoomApiBaseUrl;
    this.oauthEndpoint = this.config.zoomOAuthEndpoint;
    this.accountId = this.config.zoomAccountIdServerToServer;
    this.clientId = this.config.zoomClientIdServerToServer;
    this.clientSecret = this.config.zoomClientSecretServerToServer;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ZoomRequest>();

    const user = request.user;

    if (!user || user.role !== 'teacher') {
      return true;
    }

    const response = context.switchToHttp().getResponse<Response>();

    let token = request.cookies?.['sb_zoom_access_token'] as string;

    if (!token) {
      const { accessToken, expiresIn } = await this.getAccessToken();
      token = accessToken;
      request.expiresIn = expiresIn;
      response.cookie('sb_zoom_access_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: expiresIn * 1000,
      });
    }

    let zoomUser: ZoomUser;
    try {
      zoomUser = await this.validateZoomToken(token);
    } catch {
      const { accessToken, expiresIn } = await this.getAccessToken();
      token = accessToken;
      request.expiresIn = expiresIn;
      response.cookie('sb_zoom_access_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: expiresIn * 1000,
      });
      zoomUser = await this.validateZoomToken(token);
    }
    let zakToken = request.cookies?.['sb_zoom_zak_token'] as string | null;

    if (!zakToken) {
      zakToken = await this.getZakToken(token, zoomUser.id);
      if (!zakToken) {
        throw new UnauthorizedException('Failed to obtain Zoom ZAK token');
      }

      response.cookie('sb_zoom_zak_token', zakToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 2 * 60 * 60 * 1000,
      });
    }

    request.zoomUser = zoomUser;
    request.zoomToken = token;
    request.zoomZakToken = zakToken;

    return true;
  }

  private async validateZoomToken(token: string): Promise<ZoomUser> {
    try {
      const res = await axios.get(`${this.apiBaseUrl}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data as ZoomUser;
    } catch {
      throw new UnauthorizedException('Invalid Zoom token');
    }
  }

  private async getAccessToken(): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const response = await axios.post<ZoomOAuthResponse>(
        `${this.oauthEndpoint}?grant_type=account_credentials&account_id=${this.accountId}`,
        {},
        {
          headers: {
            Authorization:
              'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
          },
          timeout: 10000,
        },
      );

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error: unknown) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to fetch Zoom access token',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async getZakToken(token: string, userId: string): Promise<string | null> {
    try {
      const res = await axios.get<{ token: string }>(
        `${this.apiBaseUrl}/users/${userId}/token?type=zak`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return res.data.token;
    } catch (err) {
      this.logger.error('Failed to fetch ZAK token:', err);
      return null;
    }
  }
}
