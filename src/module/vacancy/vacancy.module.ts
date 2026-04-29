import { Module } from '@nestjs/common';
import { VacancyController } from './vacancy.controller';
import { VacancyService } from './vacancy.service';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { VacancyEntity } from '../database/entitis/vacancy.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ApplicationEntity } from '../database/entitis/application.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VacancyEntity, ApplicationEntity]),
    AuthModule,
  ],
  controllers: [VacancyController],
  providers: [VacancyService, CustomLogger],
  exports: [VacancyService],
})
export class VacancyModule {}
