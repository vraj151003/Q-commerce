import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductTable1775700000000 implements MigrationInterface {
  name = 'CreateProductTable1775700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying,
        "longDescription" text,
        "mrp" numeric NOT NULL,
        "sellingPrice" numeric NOT NULL,
        "discountPercentage" numeric,
        "stockQuantity" integer NOT NULL,
        "isAvailable" boolean DEFAULT true NOT NULL,
        "lowStockThreshold" integer,
        "unit" character varying NOT NULL,
        "unitValue" integer,
        "packSize" character varying,
        "brand" character varying,
        "isVeg" boolean NOT NULL,
        "expiryDays" integer,
        "images" text[],
        "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT now() NOT NULL,
        "shopId" uuid,
        "categoryId" uuid,
        "subCategoryId" uuid,
        CONSTRAINT "PK_product_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_shopId" FOREIGN KEY ("shopId") REFERENCES "shop" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_categoryId" FOREIGN KEY ("categoryId") REFERENCES "category" ("id") ON DELETE SET NULL,
        CONSTRAINT "FK_product_subCategoryId" FOREIGN KEY ("subCategoryId") REFERENCES "sub_category" ("id") ON DELETE SET NULL
      )
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_PRODUCT_SHOP_ID" ON "product" ("shopId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PRODUCT_CATEGORY_ID" ON "product" ("categoryId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PRODUCT_SUBCATEGORY_ID" ON "product" ("subCategoryId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_PRODUCT_SHOP_ID"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_PRODUCT_CATEGORY_ID"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_PRODUCT_SUBCATEGORY_ID"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "product"`);
  }
}
