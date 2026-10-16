import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { AppConfigService } from '@utils/config/config.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;

  constructor(private readonly config: AppConfigService) {
    this.resend = new Resend(this.config.resendApiKey);
  }

  async sendSetPasswordEmail(to: string, actionLink: string, name?: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.config.resendFromEmail,
      to,
      subject: 'Set your Commerce Clash password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <h2>Welcome to Commerce Clash${name ? `, ${name}` : ''}!</h2>
          <p>Your payment was successful and your account has been created. Click the button below to set your password and get started.</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${actionLink}" style="background: #22c55e; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Set Your Password</a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all;"><a href="${actionLink}">${actionLink}</a></p>
        </div>
      `,
    });

    if (error) {
      this.logger.error(`Failed to send set-password email to ${to}: ${error.message}`);
      throw new InternalServerErrorException(`Failed to send email: ${error.message}`);
    }
  }
}
