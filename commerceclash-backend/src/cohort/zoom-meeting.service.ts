import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { AppConfigService } from '@utils/config/config.service';

interface ZoomOAuthResponse {
  access_token: string;
  expires_in: number;
}

interface ZoomMeetingApiResponse {
  id: number | string;
  uuid: string;
  join_url: string;
  start_url: string;
  password?: string;
  host_id: string;
}

export interface CreatedZoomMeeting {
  meetingId: string;
  uuid: string;
  joinUrl: string;
  startUrl: string;
  passcode: string | null;
  hostId: string;
}

/**
 * Creates one real, unique Zoom meeting per cohort using Server-to-Server
 * OAuth (account-level credentials — same grant type as ZoomAuthGuard, but
 * with no dependency on a logged-in teacher's session, since cohort
 * creation must work synchronously inside an HTTP request/response cycle
 * with no interactive Zoom login step).
 *
 * Meetings are created under ZOOM_DEFAULT_HOST_USER_ID. There is
 * deliberately no fallback to a shared/static meeting anywhere in this
 * class — if Zoom creation fails, the caller must not persist a cohort.
 */
@Injectable()
export class ZoomMeetingService {
  private readonly logger = new Logger(ZoomMeetingService.name);

  constructor(private readonly config: AppConfigService) {}

  private async getAccessToken(): Promise<string> {
    try {
      const response = await axios.post<ZoomOAuthResponse>(
        `${this.config.zoomOAuthEndpoint}?grant_type=account_credentials&account_id=${this.config.zoomAccountIdServerToServer}`,
        {},
        {
          headers: {
            Authorization:
              'Basic ' +
              Buffer.from(
                `${this.config.zoomClientIdServerToServer}:${this.config.zoomClientSecretServerToServer}`,
              ).toString('base64'),
          },
          timeout: 10000,
        },
      );
      return response.data.access_token;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to obtain Zoom access token: ${message}`);
      throw new BadGatewayException({
        success: false,
        message: 'Could not authenticate with Zoom. Please try again shortly.',
      });
    }
  }

  /**
   * Creates a brand-new Zoom meeting that represents a single cohort's
   * persistent classroom. A cohort runs many class occurrences over its
   * lifetime, so this is a `type: 3` recurring-meeting-with-no-fixed-time —
   * one stable room reused by every class, not a one-off scheduled meeting
   * tied to a single start_time.
   *
   * Throws BadGatewayException on any failure — callers must treat this as
   * "the cohort cannot be created" and must NEVER substitute a
   * default/shared meeting.
   */
  async createMeeting(topic: string): Promise<CreatedZoomMeeting> {
    const accessToken = await this.getAccessToken();

    try {
      const response: AxiosResponse<ZoomMeetingApiResponse> = await axios.post(
        `${this.config.zoomApiBaseUrl}/users/${this.config.zoomDefaultHostUserId}/meetings`,
        {
          topic,
          type: 3, // recurring meeting, no fixed time — reused for every class in the cohort
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: false,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      const { id, uuid, join_url, start_url, password, host_id } = response.data;
      return {
        meetingId: String(id),
        uuid,
        joinUrl: join_url,
        startUrl: start_url,
        passcode: password ?? null,
        hostId: host_id,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create Zoom meeting for "${topic}": ${message}`);
      throw new BadGatewayException({
        success: false,
        message: 'Failed to create the Zoom meeting for this cohort. The cohort was not created.',
      });
    }
  }

  /**
   * Compensating action for the "distributed transaction": if the Zoom
   * meeting was created but the cohort row failed to persist, delete the
   * orphaned meeting instead of leaving it dangling in the host's account.
   * Best-effort — logs and swallows failures rather than masking the
   * original DB error that triggered the rollback.
   */
  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      await axios.delete(`${this.config.zoomApiBaseUrl}/meetings/${meetingId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10000,
      });
      this.logger.warn(
        `Rolled back orphaned Zoom meeting ${meetingId} after cohort persist failure`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to roll back orphaned Zoom meeting ${meetingId} — manual cleanup required: ${message}`,
      );
    }
  }
}
