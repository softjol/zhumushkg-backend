import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import {
  ChatEntity,
  ChatSource,
  ChatStatus,
  MessageEntity,
} from '../database/entitis/chat.entity';
import { CustomLogger } from '../../helpers/logger/logger.service';

export type SendMessageOutcome = {
  message: MessageEntity;
  recipientId: number;
};

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatEntity)
    private readonly chatRepo: Repository<ChatEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,
    private readonly dataSource: DataSource,
    private readonly logger: CustomLogger,
  ) {}

  async openChatFromApplication(
    hrId: number,
    candidateId: number,
    vacancyId: number,
    applicationId: number,
    refId: string,
  ): Promise<{ chat: ChatEntity; created: boolean }> {
    this.logger.debug(
      `[SERVICE] openChatFromApplication hrId=${hrId}, candidateId=${candidateId}, vacancyId=${vacancyId}`,
      refId,
    );

    const existing = await this.chatRepo.findOne({
      where: {
        hr_id: hrId,
        candidate_id: candidateId,
        vacancy_id: vacancyId,
      },
    });

    if (existing) {
      this.logger.warn(
        `[WARN] openChatFromApplication chat already exists: chatId=${existing.id}`,
        refId,
      );
      if (existing.application_id == null) {
        existing.application_id = applicationId;
        await this.chatRepo.save(existing);
      }
      return { chat: existing, created: false };
    }

    const chat = this.chatRepo.create({
      hr_id: hrId,
      candidate_id: candidateId,
      vacancy_id: vacancyId,
      application_id: applicationId,
      source: ChatSource.APPLICATION,
      status: ChatStatus.ACTIVE,
    });

    const saved = await this.chatRepo.save(chat);
    this.logger.debug(
      `[SUCCESS] openChatFromApplication chatId=${saved.id}`,
      refId,
    );
    return { chat: saved, created: true };
  }

  async openChatFromResume(
    hrId: number,
    candidateId: number,
    refId: string,
    vacancyId?: number,
  ): Promise<ChatEntity> {
    this.logger.debug(
      `[SERVICE] openChatFromResume hrId=${hrId}, candidateId=${candidateId}, vacancyId=${vacancyId}`,
      refId,
    );

    const existing = await this.chatRepo.findOne({
      where: {
        hr_id: hrId,
        candidate_id: candidateId,
        vacancy_id: vacancyId !== undefined ? vacancyId : IsNull(),
      },
    });

    if (existing) {
      this.logger.warn(
        `[WARN] openChatFromResume chat already exists: chatId=${existing.id}`,
        refId,
      );
      return existing;
    }

    const chat = this.chatRepo.create({
      hr_id: hrId,
      candidate_id: candidateId,
      vacancy_id: vacancyId ?? null,
      application_id: null,
      source: ChatSource.RESUME,
      status: ChatStatus.ACTIVE,
    });

    const saved = await this.chatRepo.save(chat);
    this.logger.debug(
      `[SUCCESS] openChatFromResume chatId=${saved.id}`,
      refId,
    );
    return saved;
  }

  async sendMessage(
    chatId: number,
    senderId: number,
    content: string,
    refId: string,
  ): Promise<SendMessageOutcome> {
    const chat = await this.assertParticipant(chatId, senderId, refId);
    if (chat.status === ChatStatus.CLOSED) {
      throw new ForbiddenException('Чат закрыт');
    }

    const message = await this.dataSource.transaction(async (manager) => {
      const msg = manager.create(MessageEntity, {
        chat_id: chatId,
        sender_id: senderId,
        content,
        is_read: false,
      });
      const saved = await manager.save(msg);
      await manager.update(ChatEntity, chatId, {
        last_message_at: saved.created_at,
      });
      return saved;
    });

    const recipientId =
      chat.hr_id === senderId ? chat.candidate_id : chat.hr_id;

    this.logger.debug(
      `[SUCCESS] sendMessage chatId=${chatId}, senderId=${senderId}, messageId=${message.id}`,
      refId,
    );
    return { message, recipientId };
  }

  async getMessages(
    chatId: number,
    userId: number,
    refId: string,
    limit = 30,
    beforeId?: number,
  ): Promise<MessageEntity[]> {
    await this.assertParticipant(chatId, userId, refId);

    const query = this.messageRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 's')
      .where('m.chat_id = :chatId', { chatId })
      .orderBy('m.created_at', 'DESC')
      .take(limit);

    if (beforeId) {
      const cursor = await this.messageRepo.findOne({
        where: { id: beforeId },
      });
      if (cursor) {
        query.andWhere('m.created_at < :date', { date: cursor.created_at });
      }
    }

    const messages = await query.getMany();
    return messages.reverse();
  }

  async markMessageAsRead(
    messageId: number,
    userId: number,
    refId: string,
  ): Promise<MessageEntity> {
    const msg = await this.messageRepo.findOne({
      where: { id: messageId },
    });
    if (!msg) {
      throw new NotFoundException('Сообщение не найдено');
    }

    await this.assertParticipant(msg.chat_id, userId, refId);

    if (msg.sender_id === userId) {
      throw new BadRequestException(
        'Нельзя отметить прочитанным собственное сообщение',
      );
    }

    if (!msg.is_read) {
      msg.is_read = true;
      msg.read_at = new Date();
      await this.messageRepo.save(msg);
    }

    return msg;
  }

  async markAsRead(
    chatId: number,
    userId: number,
    refId: string,
  ): Promise<void> {
    await this.assertParticipant(chatId, userId, refId);

    await this.messageRepo
      .createQueryBuilder()
      .update(MessageEntity)
      .set({ is_read: true, read_at: new Date() })
      .where('chat_id = :chatId', { chatId })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('is_read = false')
      .execute();
  }

  async editMessage(
    messageId: number,
    userId: number,
    content: string,
    refId: string,
  ): Promise<MessageEntity> {
    const msg = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Сообщение не найдено');
    if (msg.sender_id !== userId) {
      throw new ForbiddenException('Можно редактировать только свои сообщения');
    }
    if (msg.is_read) {
      throw new BadRequestException('Нельзя редактировать прочитанное сообщение');
    }
    msg.content = content;
    return this.messageRepo.save(msg);
  }

  async deleteMessage(
    messageId: number,
    userId: number,
    refId: string,
  ): Promise<void> {
    const msg = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Сообщение не найдено');
    if (msg.sender_id !== userId) {
      throw new ForbiddenException('Можно удалять только свои сообщения');
    }
    await this.messageRepo.delete(messageId);
    this.logger.debug(`[SUCCESS] deleteMessage messageId=${messageId}`, refId);
  }

  async getUserChats(
    userId: number,
    page = 1,
    limit = 20,
  ): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
    const offset = (page - 1) * limit;

    // Получаем чаты с последним сообщением и счётчиком непрочитанных одним запросом
    const raw = await this.chatRepo.query(
      `
      SELECT
        c.id,
        c.hr_id,
        c.candidate_id,
        c.vacancy_id,
        c.application_id,
        c.source,
        c.status,
        c.last_message_at,
        c.created_at,
        c.updated_at,

        -- Последнее сообщение
        lm.id          AS last_msg_id,
        lm.content     AS last_msg_content,
        lm.sender_id   AS last_msg_sender_id,
        lm.is_read     AS last_msg_is_read,
        lm.created_at  AS last_msg_created_at,

        -- Счётчик непрочитанных (только входящие — не от текущего пользователя)
        COALESCE(unread.cnt, 0)::int AS unread_count,

        -- Собеседник
        CASE WHEN c.hr_id = $1 THEN c.candidate_id ELSE c.hr_id END AS companion_id,
        cu."firstName" AS companion_first_name

      FROM chats c

      -- Последнее сообщение
      LEFT JOIN LATERAL (
        SELECT id, content, sender_id, is_read, created_at
        FROM messages
        WHERE chat_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
      ) lm ON true

      -- Непрочитанные
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS cnt
        FROM messages
        WHERE chat_id = c.id
          AND sender_id != $1
          AND is_read = false
      ) unread ON true

      -- Собеседник
      LEFT JOIN "user" cu
        ON cu.id = CASE WHEN c.hr_id = $1 THEN c.candidate_id ELSE c.hr_id END

      WHERE (c.hr_id = $1 OR c.candidate_id = $1)
        AND c.status = 'ACTIVE'
      ORDER BY c.last_message_at DESC NULLS LAST
      LIMIT $2 OFFSET $3
      `,
      [userId, limit, offset],
    );

    // Общее количество
    const [{ count }] = await this.chatRepo.query(
      `SELECT COUNT(*)::int AS count FROM chats
       WHERE (hr_id = $1 OR candidate_id = $1) AND status = 'ACTIVE'`,
      [userId],
    );

    const data = raw.map((r: any) => ({
      id: r.id,
      hr_id: r.hr_id,
      candidate_id: r.candidate_id,
      vacancy_id: r.vacancy_id,
      application_id: r.application_id,
      source: r.source,
      status: r.status,
      last_message_at: r.last_message_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      unread_count: Number(r.unread_count),
      companion: {
        id: r.companion_id,
        firstName: r.companion_first_name,
      },
      last_message: r.last_msg_id
        ? {
            id: r.last_msg_id,
            content: r.last_msg_content,
            sender_id: r.last_msg_sender_id,
            is_read: r.last_msg_is_read,
            created_at: r.last_msg_created_at,
          }
        : null,
    }));

    return {
      data,
      total: Number(count),
      page,
      totalPages: Math.ceil(Number(count) / limit),
    };
  }

  async getChatById(
    chatId: number,
    userId: number,
    refId: string,
  ): Promise<ChatEntity> {
    return this.assertParticipant(chatId, userId, refId);
  }

  private async assertParticipant(
    chatId: number,
    userId: number,
    refId: string,
  ): Promise<ChatEntity> {
    const chat = await this.chatRepo.findOne({ where: { id: chatId } });

    if (!chat) throw new NotFoundException('Чат не найден');

    const isParticipant = chat.hr_id === userId || chat.candidate_id === userId;
    if (!isParticipant) {
      this.logger.warn(
        `[WARN] assertParticipant access denied: chatId=${chatId}, userId=${userId}`,
        refId,
      );
      throw new ForbiddenException('Нет доступа к чату');
    }

    return chat;
  }
}
