import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationEntity } from '../database/entitis/application.entity';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller'; // твой контроллер
import { ChatModule } from '../messages/chat.module';
import { NotificationModule } from '../notification/notificant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationEntity]),
    ChatModule,
    NotificationModule,
  ],
  providers: [ApplicationService],
  controllers: [ApplicationController],
  exports: [ApplicationService],
})
export class ApplicationModule {}
