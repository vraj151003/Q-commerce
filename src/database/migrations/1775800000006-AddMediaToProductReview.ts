import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaToProductReview1775800000006 implements MigrationInterface {
  name = 'AddMediaToProductReview1775800000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_review" ADD COLUMN IF NOT EXISTS "media" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_review" DROP COLUMN IF EXISTS "media"
    `);
  }
}
