import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderTables1775800000002 implements MigrationInterface {
  name = 'CreateOrderTables1775800000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "totalAmount" numeric NOT NULL,
        "deliveryCharge" numeric NOT NULL DEFAULT 0,
        "totalItems" integer NOT NULL,
        "status" character varying NOT NULL DEFAULT 'PENDING',
        "paymentMethod" character varying,
        "paymentStatus" character varying NOT NULL DEFAULT 'PENDING',
        "addressLine1" character varying,
        "addressLine2" character varying,
        "city" character varying,
        "state" character varying,
        "country" character varying,
        "pincode" character varying,
        "latitude" numeric,
        "longitude" numeric,
        "isPaid" boolean NOT NULL DEFAULT false,
        "cancelReason" character varying,
        "cancelledAt" TIMESTAMP,
        "assignedAt" TIMESTAMP,
        "deliveryPersonId" character varying,
        "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT now() NOT NULL,
        "userId" uuid,
        CONSTRAINT "PK_order_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_userId" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_item" (
        "id" SERIAL NOT NULL,
        "quantity" integer NOT NULL,
        "price" numeric NOT NULL,
        "totalPrice" numeric NOT NULL,
        "productId" character varying NOT NULL,
        "orderId" uuid,
        CONSTRAINT "PK_order_item_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_item_orderId" FOREIGN KEY ("orderId") REFERENCES "order" ("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "order_item"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order"`);
  }
}
