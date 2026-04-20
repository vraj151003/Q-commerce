import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OtpJobData } from './processors/otp.processor';

type QueueStatus = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
};

@Injectable()
export class OtpQueueService {

  constructor(@InjectQueue('otp-queue') private readonly otpQueue: Queue) {}

  async addOtpJob(email: string, otp: string, type: 'REGISTER' | 'FORGOT_PASSWORD'): Promise<void> {
    try {
      await this.otpQueue.add(
        'send-otp',
        { email, otp, type },
        {
          delay: 0,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        }
      );
      
    } catch (error) {
      throw error;
    }
  }

  async getQueueStatus(): Promise<QueueStatus> {
    const waiting = await this.otpQueue.getWaiting();
    const active = await this.otpQueue.getActive();
    const completed = await this.otpQueue.getCompleted();
    const failed = await this.otpQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async clearQueue(): Promise<void> {
    await this.otpQueue.clean(0, 0, 'completed');
    await this.otpQueue.clean(0, 0, 'failed');
  }
}
