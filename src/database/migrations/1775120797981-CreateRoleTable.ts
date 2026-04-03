import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRoleTable1775120797981 implements MigrationInterface {
  name = 'CreateRoleTable1775120797981'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying NOT NULL UNIQUE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}
