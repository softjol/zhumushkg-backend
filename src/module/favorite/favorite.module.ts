import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteEntity } from '../database/entitis/favorite.entity';
import { VacancyEntity } from '../database/entitis/vacancy.entity';
import { FavoriteController } from './favorite.controller';
import { FavoriteService } from './favorite.service';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FavoriteEntity, VacancyEntity]),
    AuthModule,
  ],
  controllers: [FavoriteController],
  providers: [FavoriteService, CustomLogger],
  exports: [FavoriteService],
})
export class FavoriteModule {}
