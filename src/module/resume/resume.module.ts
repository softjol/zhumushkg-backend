import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { ResumeResponseService } from './resume-response/resume-response.service';
import { ResumeEntity } from '../database/entitis/resume.entity';
import { ResumeResponseEntity } from '../database/entitis/resume-response.entity';
import { UserEntity } from '../database/entitis/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { NotificationModule } from '../notification/notificant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ResumeEntity, ResumeResponseEntity, UserEntity]),
    NotificationModule,
  ],
  controllers: [ResumeController],
  providers: [ResumeService, ResumeResponseService, CustomLogger],
  exports: [ResumeService, ResumeResponseService],
})
export class ResumeModule {}
