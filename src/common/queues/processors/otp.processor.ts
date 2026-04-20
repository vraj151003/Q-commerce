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

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<OtpJobData>): Promise<void> {
    const { email, otp, type } = job.data;


    try {
      if (type === 'REGISTER') {
        await this.mailService.sendOtpEmail(email, otp);
      } else if (type === 'FORGOT_PASSWORD') {
        await this.mailService.sendForgotPasswordOtp(email, otp);
      }

    } catch (error) {
      throw error;
    }
  }
}
