import { DataSource } from 'typeorm';
import * as path from 'path';

// Для DDL (миграции) используем direct URL без pooler
const directUrl = (process.env.DATABASE_URL ?? '').replace('-pooler', '');

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: directUrl,
  ssl: { rejectUnauthorized: false },
  // Этот путь найдет ВСЕ файлы .entity.ts в папке src и подпапках
  entities: [path.join(process.cwd(), 'src/**/*.entity{.ts,.js}')],
  migrations: [path.join(process.cwd(), 'src/migrations/*{.ts,.js}')],
  synchronize: false,
});
