import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCartTables1775800000001 implements MigrationInterface {
  name = 'CreateCartTables1775800000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cart" (
        "id" SERIAL NOT NULL,
        "totalAmount" numeric NOT NULL DEFAULT 0,
        "totalItems" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT now() NOT NULL,
        "userId" uuid,
        CONSTRAINT "PK_cart_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cart_userId" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cart_item" (
        "id" SERIAL NOT NULL,
        "quantity" integer NOT NULL,
        "price" numeric NOT NULL,
        "totalPrice" numeric NOT NULL,
        "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT now() NOT NULL,
        "cartId" integer,
        "productId" character varying NOT NULL,
        CONSTRAINT "PK_cart_item_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cart_item_cartId" FOREIGN KEY ("cartId") REFERENCES "cart" ("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "cart_item"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cart"`);
  }
}
