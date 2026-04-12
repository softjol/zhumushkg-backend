import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationService } from './notificant.service';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { RefId } from '../../decorators/ref.decorator';
import {
  NotificationParamDto,
  UserParamDto,
} from './dto/notification-param.dto';

@ApiTags('Notifications')
@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
  ) {}

  @Sse('stream/:userId')
  @ApiOperation({ summary: 'SSE поток уведомлений для пользователя' })
  @ApiParam({ name: 'userId', description: 'ID пользователя' })
  stream(@Param() { userId }: UserParamDto): Observable<MessageEvent> {
    const subject = this.notificationService.subscribe(userId);
    return subject.pipe(map((data) => ({ data }) as MessageEvent));
  }

  @Get('my/:userId')
  @ApiOperation({ summary: 'Получить все уведомления пользователя' })
  @ApiParam({ name: 'userId', description: 'ID пользователя' })
  async getNotifications(
    @Param() { userId }: UserParamDto,
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

  @Patch(':id/read/:userId')
  @ApiOperation({ summary: 'Пометить уведомление как прочитанное' })
  @ApiParam({ name: 'id', description: 'ID уведомления' })
  @ApiParam({ name: 'userId', description: 'ID пользователя' })
  async markAsRead(
    @Param() { id }: NotificationParamDto,
    @Param() { userId }: UserParamDto,
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] mark as read id: ${id}, userId: ${userId}`,
      refId,
    );
    try {
      await this.notificationService.markAsRead(id, userId, refId);
      this.logger.debug(`[CONTROLLER] mark as read SUCCESS`, refId);
      return { success: true };
    } catch (error) {
      this.logger.error(`[CONTROLLER] error mark as read: ${error}`, refId);
      throw error;
    }
  }

  @Delete(':id/user/:userId')
  @ApiOperation({ summary: 'Удалить уведомление' })
  @ApiParam({ name: 'id', description: 'ID уведомления' })
  @ApiParam({ name: 'userId', description: 'ID пользователя' })
  async removeNotification(
    @Param() { id }: NotificationParamDto,
    @Param() { userId }: UserParamDto,
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] remove notification id: ${id}, userId: ${userId}`,
      refId,
    );
    try {
      await this.notificationService.removeNotification(id, userId, refId);
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
