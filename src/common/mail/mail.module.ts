import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host:
            configService.get<string>('database.mail_host') || 'smtp.gmail.com',
          port: configService.get<number>('database.mail_port') || 587,
          secure: configService.get<boolean>('database.mail_secure') || false,
          auth: {
            user: configService.get<string>('database.email'),
            pass: configService.get<string>('database.email_password'),
          },
        },
        defaults: {
          from: `"SwiftMart Support" <${configService.get<string>('database.mail_from')}>`,
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
