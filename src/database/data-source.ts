import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../modules/users/entity/users.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'testdb',
  entities: [User],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
});
