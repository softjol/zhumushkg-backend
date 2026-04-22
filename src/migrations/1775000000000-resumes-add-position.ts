import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResumesAddPosition1775000000000 implements MigrationInterface {
  name = 'ResumesAddPosition1775000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "position" character varying;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resumes" DROP COLUMN IF EXISTS "position";
    `);
  }
}
