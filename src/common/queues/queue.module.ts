import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OtpProcessor } from './processors/otp.processor';
import { OtpQueueService } from './otp-queue.service';
import { QueueResolver } from './queue.resolver';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('database.redis_host') || 'localhost',
          port: configService.get<number>('database.redis_port') || 6379,
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'otp-queue',
    }),
    MailModule,
  ],
  providers: [OtpProcessor, OtpQueueService, QueueResolver],
  exports: [BullModule, OtpQueueService],
})
export class QueueModule {}
