import { Module } from '@nestjs/common';
import { VacancyController } from './vacancy.controller';
import { VacancyService } from './vacancy.service';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { VacancyEntity } from '../database/entitis/vacancy.enity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([VacancyEntity]), AuthModule],
  controllers: [VacancyController],
  providers: [VacancyService, CustomLogger],
  exports: [VacancyService],
})
export class VacancyModule {}
