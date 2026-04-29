import { MigrationInterface, QueryRunner } from 'typeorm';

export class VacancyCategoryAndSections1772000000000 implements MigrationInterface {
  name = 'VacancyCategoryAndSections1772000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vacancy" ADD COLUMN IF NOT EXISTS "category" character varying;
    `);
    await queryRunner.query(`
      ALTER TABLE "vacancy" ADD COLUMN IF NOT EXISTS "requirements" text;
    `);
    await queryRunner.query(`
      ALTER TABLE "vacancy" ADD COLUMN IF NOT EXISTS "conditions" text;
    `);
    await queryRunner.query(`
      ALTER TABLE "vacancy" ADD COLUMN IF NOT EXISTS "description" text;
    `);

    await queryRunner.query(`
      UPDATE "vacancy"
      SET "requirements" = "requir_respons"
      WHERE "requirements" IS NULL
        AND "requir_respons" IS NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "vacancy" DROP COLUMN IF EXISTS "requir_respons";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vacancy" ADD COLUMN IF NOT EXISTS "requir_respons" text;
    `);
    await queryRunner.query(`
      UPDATE "vacancy" SET "requir_respons" = "requirements" WHERE "requir_respons" IS NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "vacancy" DROP COLUMN IF EXISTS "category";
    `);
    await queryRunner.query(`
      ALTER TABLE "vacancy" DROP COLUMN IF EXISTS "requirements";
    `);
    await queryRunner.query(`
      ALTER TABLE "vacancy" DROP COLUMN IF EXISTS "conditions";
    `);
    await queryRunner.query(`
      ALTER TABLE "vacancy" DROP COLUMN IF EXISTS "description";
    `);
  }
}
