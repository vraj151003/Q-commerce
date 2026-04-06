import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoryAndSubcategoryTables1775600000000
  implements MigrationInterface
{
  name = 'CreateCategoryAndSubcategoryTables1775600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL UNIQUE,
        "description" character varying,
        CONSTRAINT "PK_categories_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subcategories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "categoryId" uuid,
        CONSTRAINT "PK_subcategories_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subcategories_category" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_SUBCATEGORIES_CATEGORY_ID" ON "subcategories" ("categoryId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_SUBCATEGORIES_CATEGORY_ID"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subcategories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
