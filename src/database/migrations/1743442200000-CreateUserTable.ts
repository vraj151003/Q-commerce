import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1743442200000 implements MigrationInterface {
  name = 'CreateUserTable1743442200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "email" character varying NOT NULL UNIQUE,
        "password" character varying NOT NULL,
        "isVerified" boolean DEFAULT false,
        "adminApproved" boolean DEFAULT false,
        "mobile" character varying NOT NULL,
        "createdAt" TIMESTAMP DEFAULT now(),
        "roleId" integer,
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
