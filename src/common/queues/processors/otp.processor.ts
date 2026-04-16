import { Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';

export interface OtpJobData {
  email: string;
  otp: string;
  type: 'REGISTER' | 'FORGOT_PASSWORD';
}

@Injectable()
@Processor('otp-queue')
export class OtpProcessor extends WorkerHost {
  private readonly logger = new Logger(OtpProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<OtpJobData>): Promise<void> {
    const { email, otp, type } = job.data;

    this.logger.log(`Processing OTP job for ${email}, type: ${type}`);

    try {
      if (type === 'REGISTER') {
        await this.mailService.sendOtpEmail(email, otp);
      } else if (type === 'FORGOT_PASSWORD') {
        await this.mailService.sendForgotPasswordOtp(email, otp);
      }

      this.logger.log(`OTP sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${email}:`, error);
      throw error;
    }
  }
}
