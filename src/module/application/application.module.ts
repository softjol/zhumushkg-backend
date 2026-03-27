import { Module } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { ApplicationEntity } from '../database/entitis/application.entity';
import { UserEntity } from '../database/entitis/user.entity';
import { VacancyEntity } from '../database/entitis/vacancy.enity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { NotificationModule } from '../notification/notificant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationEntity, UserEntity, VacancyEntity]),
    NotificationModule,
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService, CustomLogger],
  exports: [ApplicationService],
})
export class ApplicationModule {}
