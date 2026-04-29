import { MigrationInterface, QueryRunner } from 'typeorm';

export class VacancyCompanyDescUserBan1776100000000 implements MigrationInterface {
  name = 'VacancyCompanyDescUserBan1776100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vacancy" ADD COLUMN IF NOT EXISTS "category" character varying;
    `);
    await queryRunner.query(`
      ALTER TABLE "vacancy" ADD COLUMN IF NOT EXISTS "company_description" text;
    `);
    await queryRunner.query(`
      ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "category" character varying;
    `);
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "is_banned" boolean NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vacancy" DROP COLUMN IF EXISTS "company_description";
    `);
    await queryRunner.query(`
      ALTER TABLE "user" DROP COLUMN IF EXISTS "is_banned";
    `);
  }
}
