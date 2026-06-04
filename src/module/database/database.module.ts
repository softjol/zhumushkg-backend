import { Module } from '@nestjs/common';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import { DatabaseService } from './dababase.service';
import { DatabaseController } from './database.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      // Для synchronize (DDL) используем прямое соединение без pooler
      url: (process.env.DATABASE_URL ?? '').replace('-pooler', ''),
      ssl: { rejectUnauthorized: false },
      migrations: ['dist/migrations/*.js'],
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
  ],
  controllers: [DatabaseController],
  providers: [DatabaseService, CustomLogger],
  exports: [DatabaseService],
})
export class DatabaseModule {}
