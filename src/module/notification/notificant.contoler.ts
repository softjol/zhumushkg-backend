import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Sse,
  MessageEvent,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notificant.service';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { RefId } from '../../decorators/ref.decorator';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@ApiTags('Уведомления')
@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
  ) {}

  // SSE подключение
  @Sse('stream/:userId')
  stream(
    @Param('userId', ParseIntPipe) userId: number,
  ): Observable<MessageEvent> {
    const subject = this.notificationService.subscribe(userId);
    return subject.pipe(map((data) => ({ data }) as MessageEvent));
  }

  // Получить все уведомления
  @Get('my/:userId')
  async getNotifications(
    @Param('userId', ParseIntPipe) userId: number,
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] get notifications userId: ${userId}`,
      refId,
    );
    try {
      const notifications = await this.notificationService.getNotifications(
        userId,
        refId,
      );
      this.logger.debug(`[CONTROLLER] get notifications SUCCESS`, refId);
      return notifications;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error get notifications: ${error}`,
        refId,
      );
      throw error;
    }
  }

  // Пометить как прочитанное
  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] mark as read id: ${id}`, refId);
    try {
      await this.notificationService.markAsRead(id, refId);
      this.logger.debug(`[CONTROLLER] mark as read SUCCESS`, refId);
      return { success: true };
    } catch (error) {
      this.logger.error(`[CONTROLLER] error mark as read: ${error}`, refId);
      throw error;
    }
  }

  // Удалить уведомление
  @Delete(':id')
  async removeNotification(
    @Param('id', ParseIntPipe) id: number,
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] remove notification id: ${id}`, refId);
    try {
      await this.notificationService.removeNotification(id, refId);
      this.logger.debug(`[CONTROLLER] remove notification SUCCESS`, refId);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error remove notification: ${error}`,
        refId,
      );
      throw error;
    }
  }
}
