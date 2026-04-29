import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Если work_experience всё ещё text — приводим к jsonb, чтобы драйвер отдавал массив, а не строку.
 */
export class ResumesWorkExperienceToJsonb1774000000000 implements MigrationInterface {
  name = 'ResumesWorkExperienceToJsonb1774000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resumes"
      ALTER COLUMN "work_experience" TYPE jsonb
      USING (
        CASE
          WHEN "work_experience" IS NULL THEN NULL
          ELSE "work_experience"::jsonb
        END
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resumes"
      ALTER COLUMN "work_experience" TYPE text
      USING (
        CASE
          WHEN "work_experience" IS NULL THEN NULL
          ELSE "work_experience"::text
        END
      );
    `);
  }
}
