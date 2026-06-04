import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Sse,
  MessageEvent,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notificant.service';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { RefId } from '../../decorators/ref.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@ApiTags('Уведомления')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
  ) {}

  @ApiOperation({ summary: 'SSE — поток уведомлений текущего пользователя' })
  @Sse('stream')
  stream(
    @CurrentUser() user: { id: number },
  ): Observable<MessageEvent> {
    const subject = this.notificationService.subscribe(user.id);
    return subject.pipe(map((data) => ({ data }) as MessageEvent));
  }

  @ApiOperation({ summary: 'Получить все уведомления текущего пользователя' })
  @Get('my')
  async getNotifications(
    @CurrentUser() user: { id: number },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] get notifications userId: ${user.id}`,
      refId,
    );
    try {
      const notifications = await this.notificationService.getNotifications(
        user.id,
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

  @ApiOperation({ summary: 'Пометить уведомление как прочитанное' })
  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] mark as read id: ${id}`, refId);
    try {
      await this.notificationService.markAsRead(id, user.id, refId);
      this.logger.debug(`[CONTROLLER] mark as read SUCCESS`, refId);
      return { success: true };
    } catch (error) {
      this.logger.error(`[CONTROLLER] error mark as read: ${error}`, refId);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Удалить уведомление' })
  @Delete(':id')
  async removeNotification(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] remove notification id: ${id}`, refId);
    try {
      await this.notificationService.removeNotification(id, user.id, refId);
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
