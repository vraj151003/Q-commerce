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
}));
