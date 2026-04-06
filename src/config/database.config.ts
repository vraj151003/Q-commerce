import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'testdb',
  autoLoadEntities: true,
  synchronize: process.env.NODE_ENV !== 'production',
  jwtSecret: process.env.JWT_SECRET || 'test',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '3d',
  email: process.env.EMAIL || process.env.MAIL_USER || '',
  email_password: process.env.EMAIL_PASSWORD || process.env.MAIL_PASSWORD || '',
  mail_host: process.env.MAIL_HOST || 'smtp.gmail.com',
  mail_port: parseInt(process.env.MAIL_PORT || '587', 10),
  mail_secure: process.env.MAIL_SECURE === 'true',
  mail_from:
    process.env.MAIL_FROM || process.env.EMAIL || process.env.MAIL_USER || '',
  redis_host: process.env.REDIS_HOST || 'localhost',
  redis_port: parseInt(process.env.REDIS_PORT || '6379', 10),
}));
