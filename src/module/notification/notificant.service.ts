import { Injectable, Sse } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../database/entitis/notification.entitity';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { Subject } from 'rxjs';

interface SseEvent {
  data: {
    title: string;
    body: string;
  };
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    private readonly logger: CustomLogger,
  ) {}

  // Храним подключения юзеров
  private clients = new Map<number, Set<Subject<SseEvent>>>();

  // Подключить юзера к SSE
  subscribe(userId: number): Subject<SseEvent> {
    const subject = new Subject<SseEvent>();
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set<Subject<SseEvent>>());
    }
    this.clients.get(userId)?.add(subject);
    return subject;
  }

  // Отключить юзера
  unsubscribe(userId: number, subject: Subject<SseEvent>) {
    const subjects = this.clients.get(userId);
    if (!subjects) return;
    subjects.delete(subject);
    subject.complete(); // закрываем поток
    if (subjects.size === 0) {
      this.clients.delete(userId);
    }
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

    // Сохраняем в БД
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

    // Шлём SSE если юзер подключен
    const client = this.clients.get(userId);
    if (client) {
      client.forEach((subject) => subject.next({ data: { title, body } }));
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

  async markAsRead(id: number, userId: number, refId: string) {
    this.logger.debug(`[SERVICE] mark as read id: ${id}`, refId);
    try {
      await this.notificationRepository.update(
        { id, userId },
        { isRead: true },
      );
      this.logger.debug(`[SERVICE] mark as read SUCCESS id: ${id}`, refId);
    } catch (error) {
      this.logger.error(`[ERROR] mark as read: ${error}`, refId);
      throw error;
    }
  }

  async removeNotification(id: number, userId: number, refId: string) {
    this.logger.debug(`[SERVICE] remove notification id: ${id}`, refId);
    try {
      await this.notificationRepository.delete({ id, userId });
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
