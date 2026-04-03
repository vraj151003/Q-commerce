import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPermissionTables1775199549849 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying NOT NULL UNIQUE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "roles_permissions_permission" (
        "roleId" integer NOT NULL,
        "permissionId" integer NOT NULL,
        PRIMARY KEY ("roleId", "permissionId")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "roles_permissions_permission"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
  }
}
