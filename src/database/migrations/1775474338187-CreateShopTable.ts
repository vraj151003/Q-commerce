import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShopTable1775474338187 implements MigrationInterface {
  name = 'CreateShopTable1775474338187';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shops" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "shopName" character varying NOT NULL,
        "addressLine1" character varying NOT NULL,
        "addressLine2" character varying,
        "city" character varying NOT NULL,
        "state" character varying NOT NULL,
        "pinCode" character varying NOT NULL,
        "country" character varying NOT NULL DEFAULT 'India',
        "pickupAddress" character varying,
        "gstNumber" character varying NOT NULL,
        "panNumber" character varying NOT NULL,
        "businessRegistrationNumber" character varying,
        "fssaiNumber" character varying,
        "accountHolderName" character varying NOT NULL,
        "accountNumber" character varying NOT NULL,
        "ifscCode" character varying NOT NULL,
        "bankName" character varying NOT NULL,
        "cancelledChequeImage" character varying,
        "alternatePhone" character varying,
        "whatsappNumber" character varying,
        "websiteUrl" character varying,
        "instagram" character varying,
        "facebook" character varying,
        "sellerId" uuid,
        "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
        "shopLicense" character varying,
        CONSTRAINT "PK_shops_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_shops_sellerId" FOREIGN KEY ("sellerId") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_SHOP_SELLER" ON "shops" ("sellerId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_SHOP_SELLER"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shops"`);
  }
}
