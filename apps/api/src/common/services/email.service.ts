import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { config } from '@p2p/config';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly configured: boolean;

  constructor() {
    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, fromAddress } =
      config.opsEmail;

    this.configured =
      Boolean(smtpUser?.trim()) &&
      Boolean(smtpPass?.trim()) &&
      Boolean(fromAddress?.trim());

    if (!this.configured) {
      this.logger.warn('SMTP not configured — emails will be logged only');
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost?.trim() || 'smtp.gmail.com',
      port: smtpPort || 587,
      secure: smtpSecure || false,
      auth: smtpUser
        ? {
            user: smtpUser.trim(),
            pass: smtpPass,
          }
        : undefined,
    });
  }

  async send(options: EmailOptions): Promise<void> {
    if (!this.configured) {
      this.logger.log({
        msg: 'email.skipped',
        reason: 'smtp_not_configured',
        to: options.to,
        subject: options.subject,
      });
      return;
    }

    try {
      const from = config.opsEmail.fromAddress?.trim() || 'noreply@brudapay.com';

      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log({
        msg: 'email.sent',
        to: options.to,
        subject: options.subject,
      });
    } catch (err) {
      this.logger.error({
        msg: 'email.failed',
        to: options.to,
        subject: options.subject,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async sendInviteEmail(
    to: string,
    token: string,
    role: string,
    frontendUrl: string,
  ): Promise<void> {
    const inviteLink = `${frontendUrl}/invite/${token}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Приглашение на платформу BrudaPay</h2>
        <p>Вас пригласили присоединиться к платформе с ролью <strong>${role}</strong>.</p>
        <p>Для завершения регистрации нажмите кнопку ниже:</p>
        <div style="margin: 24px 0;">
          <a href="${inviteLink}"
             style="background-color: #4F46E5; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Присоединиться
          </a>
        </div>
        <p>Или перейдите по ссылке:</p>
        <p style="word-break: break-all; color: #666;">${inviteLink}</p>
        <p style="color: #999; font-size: 12px;">
          Эта ссылка действует в течение 7 дней.
        </p>
      </div>
    `;

    const text = `Приглашение на платформу BrudaPay\n\n` +
      `Вас пригласили с ролью ${role}.\n\n` +
      `Перейдите по ссылке для регистрации:\n${inviteLink}\n\n` +
      `Ссылка действует 7 дней.`;

    await this.send({
      to,
      subject: 'Приглашение на платформу BrudaPay',
      html,
      text,
    });
  }
}
