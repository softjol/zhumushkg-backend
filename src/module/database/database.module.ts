import { Module } from "@nestjs/common";
import { CustomLogger } from "src/helpers/logger/logger.service";
import { DatabaseService } from "./dababase.service";
import { DatabaseController } from "./database.controller";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('PGURL') ?? config.get<string>('DATABASE_URL');
        const trimmed = url?.trim();
        if (!trimmed) {
          throw new Error(
            'DATABASE_URL (or PGURL) is not set. Add DATABASE_URL in Vercel → Settings → Environment Variables ( hosted Postgres: Neon / Supabase / Railway ).',
          );
        }
        const local = /localhost|127\.0\.0\.1/i.test(trimmed);
        return {
          type: 'postgres' as const,
          url: trimmed,
          ssl: local ? false : { rejectUnauthorized: false },
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
  ],
  controllers: [DatabaseController],
  providers: [DatabaseService, CustomLogger],
  exports: [DatabaseService],
})

export class DatabaseModule {}