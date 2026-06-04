import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../database/entitis/notification.entitity';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { Subject } from 'rxjs';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    private readonly logger: CustomLogger,
  ) {}

  private clients = new Map<number, Subject<any>>();

  subscribe(userId: number): Subject<any> {
    const subject = new Subject<any>();
    this.clients.set(userId, subject);
    return subject;
  }

  unsubscribe(userId: number) {
    this.clients.delete(userId);
  }

  async sendNotification(
    userId: number,
    title: string,
    body: string,
    refId: string,
  ) {
    this.logger.debug(
      `[SERVICE] send notification to userId: ${userId}`,
      refId,
    );

    try {
      const notification = this.notificationRepository.create({
        userId,
        title,
        body,
        isRead: false,
      });
      await this.notificationRepository.save(notification);
      this.logger.debug(`[SERVICE] notification saved to DB`, refId);
    } catch (error) {
      this.logger.error(`[ERROR] save notification: ${error}`, refId);
    }

    const client = this.clients.get(userId);
    if (client) {
      client.next({ data: { title, body } });
      this.logger.debug(`[SERVICE] SSE sent to userId: ${userId}`, refId);
    }
  }

  async getNotifications(userId: number, refId: string) {
    this.logger.debug(`[SERVICE] get notifications userId: ${userId}`, refId);
    try {
      return await this.notificationRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`[ERROR] get notifications: ${error}`, refId);
      throw error;
    }
  }

  async markAsRead(id: number, requesterId: number, refId: string) {
    this.logger.debug(`[SERVICE] mark as read id: ${id}`, refId);
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id },
      });
      if (!notification) {
        throw new NotFoundException(`Уведомление #${id} не найдено`);
      }
      if (notification.userId !== requesterId) {
        throw new ForbiddenException('Нет доступа к этому уведомлению');
      }
      await this.notificationRepository.update(id, { isRead: true });
      this.logger.debug(`[SERVICE] mark as read SUCCESS id: ${id}`, refId);
    } catch (error) {
      this.logger.error(`[ERROR] mark as read: ${error}`, refId);
      throw error;
    }
  }

  async removeNotification(id: number, requesterId: number, refId: string) {
    this.logger.debug(`[SERVICE] remove notification id: ${id}`, refId);
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id },
      });
      if (!notification) {
        throw new NotFoundException(`Уведомление #${id} не найдено`);
      }
      if (notification.userId !== requesterId) {
        throw new ForbiddenException('Нет доступа к этому уведомлению');
      }
      await this.notificationRepository.delete(id);
      this.logger.debug(
        `[SERVICE] remove notification SUCCESS id: ${id}`,
        refId,
      );
    } catch (error) {
      this.logger.error(`[ERROR] remove notification: ${error}`, refId);
      throw error;
    }
  }
}
