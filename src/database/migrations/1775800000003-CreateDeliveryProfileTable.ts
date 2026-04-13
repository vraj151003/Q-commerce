import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeliveryProfileTable1775800000003 implements MigrationInterface {
  name = 'CreateDeliveryProfileTable1775800000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "delivery_profile" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicleType" character varying NOT NULL,
        "vehicleName" character varying NOT NULL,
        "rcBookPhoto" character varying NOT NULL,
        "licensePhoto" character varying NOT NULL,
        "addressLine1" character varying NOT NULL,
        "addressLine2" character varying,
        "city" character varying NOT NULL,
        "state" character varying NOT NULL,
        "pincode" character varying NOT NULL,
        "location" character varying,
        "latitude" numeric NOT NULL,
        "longitude" numeric NOT NULL,
        "isAvailable" boolean NOT NULL DEFAULT true,
        "userId" uuid,
        "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT now() NOT NULL,
        CONSTRAINT "PK_delivery_profile_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_delivery_profile_userId" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_DELIVERY_PROFILE_USER" ON "delivery_profile" ("userId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_DELIVERY_PROFILE_USER"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "delivery_profile"`);
  }
}
