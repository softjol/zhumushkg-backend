import { Module } from '@nestjs/common';
import { NotificationService } from './notificant.service';
import { NotificationController } from './notificant.contoler';
import { NotificationEntity } from '../database/entitis/notification.entitity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity]), AuthModule],
  controllers: [NotificationController],
  providers: [NotificationService, CustomLogger],
  exports: [NotificationService],
})
export class NotificationModule {}
