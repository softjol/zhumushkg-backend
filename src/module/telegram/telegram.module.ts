import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramLinkService } from './telegram-link.service';
import { TelegramLinkEntity } from '../database/entitis/telegram-link.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TelegramLinkEntity])],
  providers: [TelegramBotService, TelegramLinkService],
  exports: [TelegramBotService, TelegramLinkService],
})
export class TelegramModule {}
