import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResumesCategoryAndAppRoles1776000000000 implements MigrationInterface {
  name = 'ResumesCategoryAndAppRoles1776000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "category" character varying;
    `);

    await queryRunner.query(`
      INSERT INTO "role" ("role", "description")
      SELECT 'JOB_SEEKER', 'Соискатель'
      WHERE NOT EXISTS (SELECT 1 FROM "role" WHERE "role" = 'JOB_SEEKER');
    `);
    await queryRunner.query(`
      INSERT INTO "role" ("role", "description")
      SELECT 'EMPLOYER', 'Работодатель'
      WHERE NOT EXISTS (SELECT 1 FROM "role" WHERE "role" = 'EMPLOYER');
    `);

    await queryRunner.query(`
      UPDATE "user" u
      SET "roleId" = (SELECT id FROM "role" WHERE "role" = 'JOB_SEEKER' LIMIT 1)
      WHERE "roleId" IN (SELECT id FROM "role" WHERE "role" = 'USER')
        AND EXISTS (SELECT 1 FROM "role" WHERE "role" = 'JOB_SEEKER');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resumes" DROP COLUMN IF EXISTS "category";
    `);
  }
}
