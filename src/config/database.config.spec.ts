import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from './database.config';

describe('Database Configuration', () => {
  let configService: ConfigService;

  beforeEach(async () => {
    // Clear environment variables to test default values
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.EMAIL;
    delete process.env.MAIL_USER;
    delete process.env.EMAIL_PASSWORD;
    delete process.env.MAIL_PASSWORD;
    delete process.env.MAIL_HOST;
    delete process.env.MAIL_PORT;
    delete process.env.MAIL_SECURE;
    delete process.env.MAIL_FROM;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    delete process.env.NODE_ENV;

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [databaseConfig],
        }),
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('default configuration', () => {
    it('should have correct database type', () => {
      const type = configService.get<'postgres'>('database.type');
      expect(type).toBe('postgres');
    });

    it('should have host configured', () => {
      const host = configService.get<string>('database.host');
      expect(host).toBeDefined();
      expect(typeof host).toBe('string');
    });

    it('should have port configured', () => {
      const port = configService.get<number>('database.port');
      expect(port).toBeDefined();
      expect(typeof port).toBe('number');
    });

    it('should have username configured', () => {
      const username = configService.get<string>('database.username');
      expect(username).toBeDefined();
      expect(typeof username).toBe('string');
    });

    it('should have password configured', () => {
      const password = configService.get<string>('database.password');
      expect(password).toBeDefined();
      expect(typeof password).toBe('string');
    });

    it('should have database name configured', () => {
      const database = configService.get<string>('database.database');
      expect(database).toBeDefined();
      expect(typeof database).toBe('string');
    });

    it('should have autoLoadEntities enabled', () => {
      const autoLoadEntities = configService.get<boolean>('database.autoLoadEntities');
      expect(autoLoadEntities).toBeDefined();
      expect(typeof autoLoadEntities).toBe('boolean');
    });

    it('should have synchronize configured', () => {
      const synchronize = configService.get<boolean>('database.synchronize');
      expect(synchronize).toBeDefined();
      expect(typeof synchronize).toBe('boolean');
    });
  });

  describe('JWT configuration', () => {
    it('should have JWT secret configured', () => {
      const jwtSecret = configService.get<string>('database.jwtSecret');
      expect(jwtSecret).toBeDefined();
      expect(typeof jwtSecret).toBe('string');
    });

    it('should have JWT expiration configured', () => {
      const jwtExpiresIn = configService.get<string>('database.jwtExpiresIn');
      expect(jwtExpiresIn).toBeDefined();
      expect(typeof jwtExpiresIn).toBe('string');
    });
  });

  describe('email configuration', () => {
    it('should have email configured', () => {
      const email = configService.get<string>('database.email');
      expect(email).toBeDefined();
      expect(typeof email).toBe('string');
    });

    it('should have email password configured', () => {
      const emailPassword = configService.get<string>('database.email_password');
      expect(emailPassword).toBeDefined();
      expect(typeof emailPassword).toBe('string');
    });

    it('should have mail host configured', () => {
      const mailHost = configService.get<string>('database.mail_host');
      expect(mailHost).toBeDefined();
      expect(typeof mailHost).toBe('string');
    });

    it('should have mail port configured', () => {
      const mailPort = configService.get<number>('database.mail_port');
      expect(mailPort).toBeDefined();
      expect(typeof mailPort).toBe('number');
    });

    it('should have mail secure configured', () => {
      const mailSecure = configService.get<boolean>('database.mail_secure');
      expect(mailSecure).toBeDefined();
      expect(typeof mailSecure).toBe('boolean');
    });

    it('should have mail from configured', () => {
      const mailFrom = configService.get<string>('database.mail_from');
      expect(mailFrom).toBeDefined();
      expect(typeof mailFrom).toBe('string');
    });
  });

  describe('Redis configuration', () => {
    it('should have Redis host configured', () => {
      const redisHost = configService.get<string>('database.redis_host');
      expect(redisHost).toBeDefined();
      expect(typeof redisHost).toBe('string');
    });

    it('should have Redis port configured', () => {
      const redisPort = configService.get<number>('database.redis_port');
      expect(redisPort).toBeDefined();
      expect(typeof redisPort).toBe('number');
    });
  });

  describe('Cloudinary configuration', () => {
    it('should have Cloudinary cloud name configured', () => {
      const cloudName = configService.get<string>('database.cloudinary_cloud_name');
      expect(cloudName).toBeDefined();
      expect(typeof cloudName).toBe('string');
    });

    it('should have Cloudinary API key configured', () => {
      const apiKey = configService.get<string>('database.cloudinary_api_key');
      expect(apiKey).toBeDefined();
      expect(typeof apiKey).toBe('string');
    });

    it('should have Cloudinary API secret configured', () => {
      const apiSecret = configService.get<string>('database.cloudinary_api_secret');
      expect(apiSecret).toBeDefined();
      expect(typeof apiSecret).toBe('string');
    });
  });

  describe('configuration with environment variables', () => {
    beforeEach(() => {
      process.env.DB_HOST = 'custom-host';
      process.env.DB_PORT = '3306';
      process.env.DB_USERNAME = 'custom-user';
      process.env.DB_PASSWORD = 'custom-password';
      process.env.DB_NAME = 'custom-db';
      process.env.JWT_SECRET = 'custom-secret';
      process.env.JWT_EXPIRES_IN = '7d';
    });

    afterEach(() => {
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;
      delete process.env.DB_USERNAME;
      delete process.env.DB_PASSWORD;
      delete process.env.DB_NAME;
      delete process.env.JWT_SECRET;
      delete process.env.JWT_EXPIRES_IN;
    });

    it('should use custom DB_HOST from environment', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
          }),
        ],
      }).compile();

      const customConfigService = module.get<ConfigService>(ConfigService);
      const host = customConfigService.get<string>('database.host');
      expect(host).toBe('custom-host');
    });

    it('should use custom DB_PORT from environment', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
          }),
        ],
      }).compile();

      const customConfigService = module.get<ConfigService>(ConfigService);
      const port = customConfigService.get<number>('database.port');
      expect(port).toBe(3306);
    });

    it('should use custom DB_USERNAME from environment', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
          }),
        ],
      }).compile();

      const customConfigService = module.get<ConfigService>(ConfigService);
      const username = customConfigService.get<string>('database.username');
      expect(username).toBe('custom-user');
    });

    it('should use custom DB_PASSWORD from environment', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
          }),
        ],
      }).compile();

      const customConfigService = module.get<ConfigService>(ConfigService);
      const password = customConfigService.get<string>('database.password');
      expect(password).toBe('custom-password');
    });

    it('should use custom DB_NAME from environment', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
          }),
        ],
      }).compile();

      const customConfigService = module.get<ConfigService>(ConfigService);
      const database = customConfigService.get<string>('database.database');
      expect(database).toBe('custom-db');
    });

    it('should use custom JWT_SECRET from environment', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
          }),
        ],
      }).compile();

      const customConfigService = module.get<ConfigService>(ConfigService);
      const jwtSecret = customConfigService.get<string>('database.jwtSecret');
      expect(jwtSecret).toBe('custom-secret');
    });

    it('should use custom JWT_EXPIRES_IN from environment', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
          }),
        ],
      }).compile();

      const customConfigService = module.get<ConfigService>(ConfigService);
      const jwtExpiresIn = customConfigService.get<string>('database.jwtExpiresIn');
      expect(jwtExpiresIn).toBe('7d');
    });
  });

  describe('synchronize configuration in production', () => {
    it('should have synchronize disabled in production', async () => {
      process.env.NODE_ENV = 'production';
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
          }),
        ],
      }).compile();

      const customConfigService = module.get<ConfigService>(ConfigService);
      const synchronize = customConfigService.get<boolean>('database.synchronize');
      expect(synchronize).toBe(false);
      delete process.env.NODE_ENV;
    });
  });

  describe('edge cases', () => {
    it('should handle empty DB_HOST', async () => {
      process.env.DB_HOST = '';
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
          }),
        ],
      }).compile();

      const customConfigService = module.get<ConfigService>(ConfigService);
      const host = customConfigService.get<string>('database.host');
      expect(host).toBeDefined();
      expect(typeof host).toBe('string');
      delete process.env.DB_HOST;
    });

    it('should handle invalid DB_PORT', async () => {
      process.env.DB_PORT = 'invalid';
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
          }),
        ],
      }).compile();

      const customConfigService = module.get<ConfigService>(ConfigService);
      const port = customConfigService.get<number>('database.port');
      expect(port).toBeNaN();
      delete process.env.DB_PORT;
    });

    it('should handle very long DB_NAME', async () => {
      process.env.DB_NAME = 'a'.repeat(1000);
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
          }),
        ],
      }).compile();

      const customConfigService = module.get<ConfigService>(ConfigService);
      const database = customConfigService.get<string>('database.database');
      expect(database).toBe('a'.repeat(1000));
      delete process.env.DB_NAME;
    });

    it('should handle special characters in password', async () => {
      process.env.DB_PASSWORD = 'p@ssw0rd!#$%^&*()';
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
          }),
        ],
      }).compile();

      const customConfigService = module.get<ConfigService>(ConfigService);
      const password = customConfigService.get<string>('database.password');
      expect(password).toBe('p@ssw0rd!#$%^&*()');
      delete process.env.DB_PASSWORD;
    });

    it('should handle JWT_EXPIRES_IN with various formats', async () => {
      process.env.JWT_EXPIRES_IN = '1h';
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
          }),
        ],
      }).compile();

      const customConfigService = module.get<ConfigService>(ConfigService);
      const jwtExpiresIn = customConfigService.get<string>('database.jwtExpiresIn');
      expect(jwtExpiresIn).toBe('1h');
      delete process.env.JWT_EXPIRES_IN;
    });

    it('should handle MAIL_SECURE as string "true"', async () => {
      process.env.MAIL_SECURE = 'true';
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
          }),
        ],
      }).compile();

      const customConfigService = module.get<ConfigService>(ConfigService);
      const mailSecure = customConfigService.get<boolean>('database.mail_secure');
      expect(mailSecure).toBe(true);
      delete process.env.MAIL_SECURE;
    });

    it('should handle MAIL_SECURE as string "false"', async () => {
      process.env.MAIL_SECURE = 'false';
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
          }),
        ],
      }).compile();

      const customConfigService = module.get<ConfigService>(ConfigService);
      const mailSecure = customConfigService.get<boolean>('database.mail_secure');
      expect(mailSecure).toBe(false);
      delete process.env.MAIL_SECURE;
    });
  });
});
