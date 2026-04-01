import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignUsersTableWithRequiredFields1743442800000
  implements MigrationInterface
{
  name = 'AlignUsersTableWithRequiredFields1743442800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "firstName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isVerified" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "adminApproved" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mobile" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "roleId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT now()`,
    );

    await queryRunner.query(
      `UPDATE "users" SET "firstName" = COALESCE("firstName", '') WHERE "firstName" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "lastName" = COALESCE("lastName", '') WHERE "lastName" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "mobile" = COALESCE("mobile", '') WHERE "mobile" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "isVerified" = COALESCE("isVerified", false) WHERE "isVerified" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "adminApproved" = COALESCE("adminApproved", false) WHERE "adminApproved" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "firstName" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "lastName" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "mobile" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "isVerified" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "adminApproved" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "firstName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "lastName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "isVerified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "adminApproved"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "mobile"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "roleId"`);
  }
}
