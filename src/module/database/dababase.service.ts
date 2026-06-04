import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.ensureColumns();
  }

  /** Добавляет недостающие колонки чтобы не падать при synchronize через pooler */
  private async ensureColumns() {
    const migrations: Array<{ check: string; alter: string; name: string }> = [
      {
        name: 'sms_code_sent_at',
        check: `SELECT 1 FROM information_schema.columns
                WHERE table_name='user' AND column_name='sms_code_sent_at'`,
        alter: `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS sms_code_sent_at TIMESTAMPTZ`,
      },
      {
        name: 'is_banned',
        check: `SELECT 1 FROM information_schema.columns
                WHERE table_name='user' AND column_name='is_banned'`,
        alter: `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false`,
      },
    ];

    for (const m of migrations) {
      try {
        const rows = await this.dataSource.query(m.check);
        if (!rows.length) {
          await this.dataSource.query(m.alter);
          this.logger.log(`✅ Column "${m.name}" added`);
        }
      } catch (err) {
        this.logger.error(`❌ ensureColumns "${m.name}": ${err.message}`);
      }
    }
  }
}
