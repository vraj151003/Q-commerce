import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { User } from '../users/entity/users.entity';
import { Role } from '../roles/entity/roles.entity';
import { Permission } from '../permission/entity/permission.entity';
import { Otp } from '../otp/entity/otp.entity';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MailService } from '../../common/mail/mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission, Otp]),
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('database.jwtSecret') || 'test',
        signOptions: {
          expiresIn: (configService.get<string>('database.jwtExpiresIn') ||
            '3d') as StringValue,
        },
      }),
    }),
  ],
  providers: [AuthService, AuthResolver, JwtStrategy, JwtAuthGuard, MailService],
})
export class AuthModule {}
