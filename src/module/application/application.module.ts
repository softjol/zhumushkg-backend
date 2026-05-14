import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationEntity } from '../database/entitis/application.entity';
import { ResumeEntity } from '../database/entitis/resume.entity';
import { VacancyEntity } from '../database/entitis/vacancy.entity';
import { ApplicationService } from './application.service';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import { ApplicationController } from './application.controller';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../messages/chat.module';
import { NotificationModule } from '../notification/notificant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationEntity, ResumeEntity, VacancyEntity]),
    AuthModule,
    ChatModule,
    NotificationModule,
  ],
  providers: [ApplicationService, CustomLogger],
  controllers: [ApplicationController],
  exports: [ApplicationService],
})
export class ApplicationModule {}
