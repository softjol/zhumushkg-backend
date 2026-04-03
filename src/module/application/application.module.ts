import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationEntity } from '../database/entitis/application.entity';
import { ApplicationService } from './application.service';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import { ApplicationController } from './application.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ApplicationEntity])],
  providers: [ApplicationService, CustomLogger],
  controllers: [ApplicationController],
  exports: [ApplicationService],
})
export class ApplicationModule {}
