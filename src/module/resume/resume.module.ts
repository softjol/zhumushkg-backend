import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { ResumeResponseService } from './resume-response/resume-response.service';
import { ResumeEntity } from '../database/entitis/resume.entity';
import { ResumeResponseEntity } from '../database/entitis/resume-response.entity';
import { ApplicationEntity } from '../database/entitis/application.entity';
import { UserEntity } from '../database/entitis/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { NotificationModule } from '../notification/notificant.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResumeEntity,
      ResumeResponseEntity,
      ApplicationEntity,
      UserEntity,
    ]),
    NotificationModule,
    AuthModule,
  ],
  controllers: [ResumeController],
  providers: [ResumeService, ResumeResponseService, CustomLogger],
  exports: [ResumeService, ResumeResponseService],
})
export class ResumeModule {}
