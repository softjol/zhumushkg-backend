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

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatEntity)
    private readonly chatRepo: Repository<ChatEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async openChatFromApplication(
    hrId: number,
    candidateId: number,
    vacancyId: number,
    applicationId: number,
  ): Promise<ChatEntity> {
    // Идемпотентность — если чат уже есть, возвращаем его
    const existing = await this.chatRepo.findOne({
      where: { hr_id: hrId, candidate_id: candidateId, vacancy_id: vacancyId },
    });
    if (existing) return existing;

    const chat = this.chatRepo.create({
      hr_id: hrId,
      candidate_id: candidateId,
      vacancy_id: vacancyId,
      application_id: applicationId,
      source: ChatSource.APPLICATION,
      status: ChatStatus.ACTIVE,
    });

    return this.chatRepo.save(chat);
  }

  async openChatFromResume(
    hrId: number,
    candidateId: number,
    vacancyId?: number,
  ): Promise<ChatEntity> {
    // Если чат уже есть (например кандидат уже откликался) — возвращаем его
    const existing = await this.chatRepo.findOne({
      where: {
        hr_id: hrId,
        candidate_id: candidateId,
        vacancy_id: vacancyId !== undefined ? vacancyId : IsNull(),
      },
    });
    if (existing) return existing;

    const chat = this.chatRepo.create({
      hr_id: hrId,
      candidate_id: candidateId,
      vacancy_id: vacancyId ?? null,
      application_id: null,
      source: ChatSource.RESUME,
      status: ChatStatus.ACTIVE,
    });

    return this.chatRepo.save(chat);
  }

  async sendMessage(
    chatId: number,
    senderId: number,
    content: string,
  ): Promise<MessageEntity> {
    const chat = await this.chatRepo.findOne({ where: { id: chatId } });

    if (!chat) throw new NotFoundException('Чат не найден');
    if (chat.status === ChatStatus.CLOSED) {
      throw new ForbiddenException('Чат закрыт');
    }

    const isParticipant =
      chat.hr_id === senderId || chat.candidate_id === senderId;
    if (!isParticipant) throw new ForbiddenException('Нет доступа к чату');

    // Сохраняем сообщение + обновляем last_message_at в одной транзакции
    return this.dataSource.transaction(async (manager) => {
      const message = manager.create(MessageEntity, {
        chat_id: chatId,
        sender_id: senderId,
        content,
        is_read: false,
      });
      const saved = await manager.save(message);
      await manager.update(ChatEntity, chatId, {
        last_message_at: saved.created_at,
      });
      return saved;
    });
  }

  async getMessages(
    chatId: number,
    userId: number,
    limit = 30,
    beforeId?: number,
  ): Promise<MessageEntity[]> {
    await this.assertParticipant(chatId, userId);

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

  async markAsRead(chatId: number, userId: number): Promise<void> {
    await this.assertParticipant(chatId, userId);

    await this.messageRepo
      .createQueryBuilder()
      .update(MessageEntity)
      .set({ is_read: true, read_at: new Date() })
      .where('chat_id = :chatId', { chatId })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('is_read = false')
      .execute();
  }

  async getUserChats(userId: number): Promise<ChatEntity[]> {
    return this.chatRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect(
        'c.messages',
        'm',
        // подгружаем только последнее сообщение
        'm.id = (SELECT id FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1)',
      )
      .where('c.hr_id = :userId OR c.candidate_id = :userId', { userId })
      .andWhere('c.status = :status', { status: ChatStatus.ACTIVE })
      .orderBy('c.last_message_at', 'DESC', 'NULLS LAST')
      .getMany();
  }

  async getChatById(chatId: number, userId: number): Promise<ChatEntity> {
    return this.assertParticipant(chatId, userId);
  }

  private async assertParticipant(
    chatId: number,
    userId: number,
  ): Promise<ChatEntity> {
    const chat = await this.chatRepo.findOne({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Чат не найден');

    const isParticipant = chat.hr_id === userId || chat.candidate_id === userId;
    if (!isParticipant) throw new ForbiddenException('Нет доступа к чату');

    return chat;
  }
}
