import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Sse,
  MessageEvent,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationService } from './notificant.service';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { RefId } from '../../decorators/ref.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationParamDto } from './dto/notification-param.dto';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
  ) {}

  @Sse('stream')
  @ApiOperation({ summary: 'SSE поток уведомлений для пользователя' })
  stream(
    @CurrentUser() user: { id: number; role: string },
  ): Observable<MessageEvent> {
    const subject = this.notificationService.subscribe(user.id);
    return subject.pipe(map((data) => ({ data }) as MessageEvent));
  }

  @Get('my')
  @ApiOperation({ summary: 'Получить все уведомления пользователя' })
  async getNotifications(
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] get notifications userId=${user.id}`,
      refId,
    );
    try {
      const notifications = await this.notificationService.getNotifications(
        user.id,
        refId,
      );
      this.logger.debug(
        `[CONTROLLER] get notifications SUCCESS userId=${user.id}, count=${notifications.length}`,
        refId,
      );
      return notifications;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error get notifications userId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Пометить уведомление как прочитанное' })
  @ApiParam({ name: 'id', description: 'ID уведомления' })
  async markAsRead(
    @Param() { id }: NotificationParamDto,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] mark as read id=${id}, userId=${user.id}`,
      refId,
    );
    try {
      await this.notificationService.markAsRead(id, user.id, refId);
      this.logger.debug(
        `[CONTROLLER] mark as read SUCCESS id=${id}, userId=${user.id}`,
        refId,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error mark as read id=${id}, userId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить уведомление' })
  @ApiParam({ name: 'id', description: 'ID уведомления' })
  async removeNotification(
    @Param() { id }: NotificationParamDto,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] remove notification id=${id}, userId=${user.id}`,
      refId,
    );
    try {
      await this.notificationService.removeNotification(id, user.id, refId);
      this.logger.debug(
        `[CONTROLLER] remove notification SUCCESS id=${id}, userId=${user.id}`,
        refId,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error remove notification id=${id}, userId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }
}
