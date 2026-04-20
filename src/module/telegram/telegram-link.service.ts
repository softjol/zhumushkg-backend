import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelegramLinkEntity } from '../database/entitis/telegram-link.entity';

@Injectable()
export class TelegramLinkService {
  constructor(
    @InjectRepository(TelegramLinkEntity)
    private readonly telegramLinkRepo: Repository<TelegramLinkEntity>,
  ) {}

  async upsertLink(phoneNumber: string, chatId: string) {
    const existing = await this.telegramLinkRepo.findOne({
      where: { phoneNumber },
    });

    if (existing) {
      existing.chatId = chatId;
      return this.telegramLinkRepo.save(existing);
    }

    const created = this.telegramLinkRepo.create({ phoneNumber, chatId });
    return this.telegramLinkRepo.save(created);
  }

  async findChatIdByPhone(phoneNumber: string) {
    const link = await this.telegramLinkRepo.findOne({
      where: { phoneNumber },
    });
    return link?.chatId ?? null;
  }
}
