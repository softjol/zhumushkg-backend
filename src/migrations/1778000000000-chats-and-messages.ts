import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Таблицы диалогов и сообщений (см. ChatEntity / MessageEntity).
 * Идемпотентно: IF NOT EXISTS — безопасно при включённом synchronize в dev.
 */
export class ChatsAndMessages1778000000000 implements MigrationInterface {
  name = 'ChatsAndMessages1778000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chats" (
        "id" SERIAL NOT NULL,
        "hr_id" integer NOT NULL,
        "candidate_id" integer NOT NULL,
        "vacancy_id" integer,
        "application_id" integer,
        "source" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'ACTIVE',
        "last_message_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chats" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "chats" ADD CONSTRAINT "UQ_chats_hr_candidate_vacancy"
          UNIQUE ("hr_id", "candidate_id", "vacancy_id");
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "chats" ADD CONSTRAINT "FK_chats_hr"
          FOREIGN KEY ("hr_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "chats" ADD CONSTRAINT "FK_chats_candidate"
          FOREIGN KEY ("candidate_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "chats" ADD CONSTRAINT "FK_chats_vacancy"
          FOREIGN KEY ("vacancy_id") REFERENCES "vacancy"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "chats" ADD CONSTRAINT "FK_chats_application"
          FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" SERIAL NOT NULL,
        "chat_id" integer NOT NULL,
        "sender_id" integer NOT NULL,
        "content" text NOT NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "read_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_chat"
          FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_sender"
          FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "messages";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chats";`);
  }
}
