import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

type JwtPayload = {
  userId: string;
  role: string;
  permissions: string[];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const rawOrBearerTokenExtractor = (req: Request): string | null => {
      const authHeader = req?.headers?.authorization;

      if (!authHeader || typeof authHeader !== 'string') {
        return null;
      }

      const trimmed = authHeader.trim();
      if (!trimmed) {
        return null;
      }

      if (/^Bearer\s+/i.test(trimmed)) {
        return trimmed.replace(/^Bearer\s+/i, '').trim();
      }

      return trimmed;
    };

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        rawOrBearerTokenExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('database.jwtSecret') || 'test',
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.userId,
      role: payload.role,
      permissions: payload.permissions,
    };
  }
}
