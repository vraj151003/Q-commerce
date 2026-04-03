import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    const user = this.configService.get<string>('database.email') || '';
    const password =
      this.configService.get<string>('database.email_password') || '';
    const host =
      this.configService.get<string>('database.mail_host') || 'smtp.gmail.com';
    const port = this.configService.get<number>('database.mail_port') || 587;
    const secure =
      this.configService.get<boolean>('database.mail_secure') || false;
    const from =
      this.configService.get<string>('database.mail_from') ||
      user;

    if (!user || !password) {
      throw new InternalServerErrorException(
        'Email configuration is missing. Set EMAIL/EMAIL_PASSWORD or MAIL_USER/MAIL_PASSWORD in environment.',
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: password,
      },
    });

    await transporter.sendMail({
      to,
      subject,
      text,
      from,
    });
  }
}
