import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropProfessionLandingReviews1779000000000
  implements MigrationInterface
{
  name = 'DropProfessionLandingReviews1779000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vacancy" DROP COLUMN IF EXISTS "profession";
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "landing_reviews" (
        "id" SERIAL NOT NULL,
        "author_name" character varying(120),
        "text" text NOT NULL,
        "rating" smallint NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_landing_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_landing_reviews_rating" CHECK ("rating" >= 1 AND "rating" <= 5)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "landing_reviews";`);
    await queryRunner.query(`
      ALTER TABLE "vacancy" ADD COLUMN IF NOT EXISTS "profession" character varying NOT NULL DEFAULT '';
    `);
  }
}
