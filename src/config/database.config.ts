import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'testdb',
  autoLoadEntities: true,
  synchronize: false,
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
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY || '',
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    username: process.env.ELASTICSEARCH_USERNAME || undefined,
    password: process.env.ELASTICSEARCH_PASSWORD || undefined,
  },
}));
