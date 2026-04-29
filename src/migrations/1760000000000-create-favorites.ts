import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFavorites1760000000000 implements MigrationInterface {
  name = 'CreateFavorites1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "favorites" (
        "id" SERIAL PRIMARY KEY,
        "user_id" integer NOT NULL,
        "vacancy_id" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_favorites_user_vacancy" UNIQUE ("user_id", "vacancy_id"),
        CONSTRAINT "FK_favorites_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_favorites_vacancy" FOREIGN KEY ("vacancy_id") REFERENCES "vacancy"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "favorites";`);
  }
}
