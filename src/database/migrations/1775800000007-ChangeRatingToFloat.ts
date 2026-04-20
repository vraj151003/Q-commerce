import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeRatingToFloat1775800000007 implements MigrationInterface {
  name = 'ChangeRatingToFloat1775800000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_review" ALTER COLUMN "rating" TYPE numeric
    `);

    await queryRunner.query(`
      ALTER TABLE "seller_review" ALTER COLUMN "rating" TYPE numeric
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "product_review" ALTER COLUMN "rating" TYPE integer
    `);

    await queryRunner.query(`
      ALTER TABLE "seller_review" ALTER COLUMN "rating" TYPE integer
    `);
  }
}
