import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { ResumeEntity } from '../database/entitis/resume.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomLogger } from 'src/helpers/logger/logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([ResumeEntity])],
  controllers: [ResumeController],
  providers: [ResumeService, CustomLogger],
  exports: [ResumeService],
})
export class ResumeModule {}
