import {
  Injectable,
  NotFoundException,
  ForbiddenException,
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
  ): Promise<ChatEntity> {
    this.logger.debug(
      `[SERVICE] openChatFromApplication hrId=${hrId}, candidateId=${candidateId}, vacancyId=${vacancyId}`,
      refId,
    );

    try {
      // Идемпотентность — если чат уже есть, возвращаем его
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
        return existing;
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
      return saved;
    } catch (error) {
      this.logger.error(
        `[ERROR] openChatFromApplication hrId=${hrId}, candidateId=${candidateId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
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

    try {
      // Если чат уже есть (например кандидат уже откликался) — возвращаем его
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
    } catch (error) {
      this.logger.error(
        `[ERROR] openChatFromResume hrId=${hrId}, candidateId=${candidateId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async sendMessage(
    chatId: number,
    senderId: number,
    content: string,
    refId: string,
  ): Promise<MessageEntity> {
    this.logger.debug(
      `[SERVICE] sendMessage chatId=${chatId}, senderId=${senderId}`,
      refId,
    );

    try {
      const chat = await this.chatRepo.findOne({ where: { id: chatId } });

      if (!chat) throw new NotFoundException('Чат не найден');
      if (chat.status === ChatStatus.CLOSED) {
        throw new ForbiddenException('Чат закрыт');
      }

      const isParticipant =
        chat.hr_id === senderId || chat.candidate_id === senderId;
      if (!isParticipant) throw new ForbiddenException('Нет доступа к чату');

      // Сохраняем сообщение + обновляем last_message_at в одной транзакции
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

      this.logger.debug(
        `[SUCCESS] sendMessage chatId=${chatId}, senderId=${senderId}, messageId=${message.id}`,
        refId,
      );
      return message;
    } catch (error) {
      this.logger.error(
        `[ERROR] sendMessage chatId=${chatId}, senderId=${senderId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async getMessages(
    chatId: number,
    userId: number,
    refId: string,
    limit = 30,
    beforeId?: number,
  ): Promise<MessageEntity[]> {
    this.logger.debug(
      `[SERVICE] getMessages chatId=${chatId}, userId=${userId}, limit=${limit}`,
      refId,
    );

    try {
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

      this.logger.debug(
        `[SUCCESS] getMessages chatId=${chatId}, userId=${userId}, count=${messages.length}`,
        refId,
      );
      return messages.reverse();
    } catch (error) {
      this.logger.error(
        `[ERROR] getMessages chatId=${chatId}, userId=${userId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async markAsRead(
    chatId: number,
    userId: number,
    refId: string,
  ): Promise<void> {
    this.logger.debug(
      `[SERVICE] markAsRead chatId=${chatId}, userId=${userId}`,
      refId,
    );

    try {
      await this.assertParticipant(chatId, userId, refId);

      await this.messageRepo
        .createQueryBuilder()
        .update(MessageEntity)
        .set({ is_read: true, read_at: new Date() })
        .where('chat_id = :chatId', { chatId })
        .andWhere('sender_id != :userId', { userId })
        .andWhere('is_read = false')
        .execute();

      this.logger.debug(
        `[SUCCESS] markAsRead chatId=${chatId}, userId=${userId}`,
        refId,
      );
    } catch (error) {
      this.logger.error(
        `[ERROR] markAsRead chatId=${chatId}, userId=${userId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async getUserChats(userId: number, refId: string): Promise<ChatEntity[]> {
    this.logger.debug(`[SERVICE] getUserChats userId=${userId}`, refId);

    try {
      const chats = await this.chatRepo
        .createQueryBuilder('c')
        .leftJoinAndSelect(
          'c.messages',
          'm',
          'm.id = (SELECT id FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1)',
        )
        .where('c.hr_id = :userId OR c.candidate_id = :userId', { userId })
        .andWhere('c.status = :status', { status: ChatStatus.ACTIVE })
        .orderBy('c.last_message_at', 'DESC', 'NULLS LAST')
        .getMany();

      this.logger.debug(
        `[SUCCESS] getUserChats userId=${userId}, count=${chats.length}`,
        refId,
      );
      return chats;
    } catch (error) {
      this.logger.error(
        `[ERROR] getUserChats userId=${userId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async getChatById(
    chatId: number,
    userId: number,
    refId: string,
  ): Promise<ChatEntity> {
    this.logger.debug(
      `[SERVICE] getChatById chatId=${chatId}, userId=${userId}`,
      refId,
    );

    try {
      const chat = await this.assertParticipant(chatId, userId, refId);
      this.logger.debug(
        `[SUCCESS] getChatById chatId=${chatId}, userId=${userId}`,
        refId,
      );
      return chat;
    } catch (error) {
      this.logger.error(
        `[ERROR] getChatById chatId=${chatId}, userId=${userId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
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
