import { DataSource } from 'typeorm';
import * as path from 'path';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: 'postgresql://neondb_owner:npg_Or2DIgEa6Knk@ep-broad-sky-ailsmdj7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false },
  // Этот путь найдет ВСЕ файлы .entity.ts в папке src и подпапках
  entities: [path.join(process.cwd(), 'src/**/*.entity{.ts,.js}')],
  migrations: [path.join(process.cwd(), 'src/migrations/*{.ts,.js}')],
  synchronize: false,
});
