/**
 * Запуск: npx ts-node scripts/add-sms-column.ts
 * Добавляет колонку sms_code_sent_at в таблицу user напрямую (без pooler)
 */
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  // Меняем pooler URL на direct URL для DDL операций
  const url = (process.env.DATABASE_URL ?? '').replace('-pooler', '');

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to DB');

  await client.query(`
    ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS "sms_code_sent_at" TIMESTAMPTZ NULL
  `);
  console.log('✅ Column sms_code_sent_at added (or already existed)');

  await client.end();
}

main().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
