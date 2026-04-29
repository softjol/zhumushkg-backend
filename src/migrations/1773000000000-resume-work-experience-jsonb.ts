import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResumeWorkExperienceJsonb1773000000000 implements MigrationInterface {
  name = 'ResumeWorkExperienceJsonb1773000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resumes" ADD COLUMN "work_experience_json" jsonb;
    `);

    await queryRunner.query(`
      UPDATE "resumes"
      SET "work_experience_json" = CASE
        WHEN "work_experience" IS NOT NULL AND btrim("work_experience"::text) != ''
        THEN jsonb_build_array(
          jsonb_build_object(
            'company', '',
            'position', '',
            'start_month', 1,
            'start_year', 2000,
            'until_now', false,
            'end_month', 1,
            'end_year', 2000,
            'description', "work_experience"
          )
        )
        ELSE NULL
      END;
    `);

    await queryRunner.query(`
      ALTER TABLE "resumes" DROP COLUMN "work_experience";
    `);

    await queryRunner.query(`
      ALTER TABLE "resumes" RENAME COLUMN "work_experience_json" TO "work_experience";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resumes" ADD COLUMN "work_experience_text" text;
    `);

    await queryRunner.query(`
      UPDATE "resumes"
      SET "work_experience_text" = CASE
        WHEN "work_experience" IS NOT NULL AND jsonb_typeof("work_experience") = 'array'
          AND jsonb_array_length("work_experience") > 0
        THEN COALESCE(
          "work_experience"->0->>'description',
          "work_experience"::text
        )
        ELSE NULL
      END;
    `);

    await queryRunner.query(`
      ALTER TABLE "resumes" DROP COLUMN "work_experience";
    `);

    await queryRunner.query(`
      ALTER TABLE "resumes" RENAME COLUMN "work_experience_text" TO "work_experience";
    `);
  }
}
