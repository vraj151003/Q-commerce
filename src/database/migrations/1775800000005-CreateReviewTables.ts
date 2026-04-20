import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewTables1775800000005 implements MigrationInterface {
  name = 'CreateReviewTables1775800000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_review" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "rating" integer NOT NULL,
        "comment" character varying,
        "userId" uuid,
        "productId" character varying,
        "orderId" uuid,
        "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT now() NOT NULL,
        CONSTRAINT "PK_product_review_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_review_userId" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_review_productId" FOREIGN KEY ("productId") REFERENCES "product" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_review_orderId" FOREIGN KEY ("orderId") REFERENCES "order" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "seller_review" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "rating" integer NOT NULL,
        "comment" character varying,
        "userId" uuid,
        "shopId" uuid,
        "orderId" uuid,
        "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT now() NOT NULL,
        CONSTRAINT "PK_seller_review_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_seller_review_userId" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_seller_review_shopId" FOREIGN KEY ("shopId") REFERENCES "shop" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_seller_review_orderId" FOREIGN KEY ("orderId") REFERENCES "order" ("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "seller_review"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_review"`);
  }
}
