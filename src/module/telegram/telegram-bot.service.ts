import { Injectable, OnModuleInit } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { TelegramLinkService } from './telegram-link.service';

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private bot: TelegramBot | null = null;

  constructor(private readonly telegramLinkService: TelegramLinkService) {}

  onModuleInit() {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      return;
    }

    // Отправка сообщений работает без polling (HTTP к api.telegram.org).
    // Long polling на Vercel по умолчанию выключен — иначе зависает инвокация.
    const usePolling =
      process.env.VERCEL !== '1' ||
      process.env.TELEGRAM_ENABLE_POLLING === 'true';

    this.bot = new TelegramBot(token, { polling: usePolling });

    if (usePolling) {
      this.setupStartHandler();
      this.setupContactHandler();
    }
  }

  private setupStartHandler() {
    if (!this.bot) return;

    this.bot.onText(/\/start/, (msg) => {
      this.bot?.sendMessage(msg.chat.id, 'Отправь свой номер', {
        reply_markup: {
          keyboard: [
            [
              {
                text: '📱 Отправить номер',
                request_contact: true,
              },
            ],
          ],
          one_time_keyboard: true,
        },
      });
    });
  }

  private setupContactHandler() {
    if (!this.bot) return;

    this.bot.on('contact', async (msg) => {
      const phone = msg.contact?.phone_number;
      const chatId = msg.chat.id.toString();

      if (!phone) return;

      const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;

      // Всегда сохраняем связь phone ↔ chatId (даже если пользователя ещё нет)
      await this.telegramLinkService.upsertLink(normalizedPhone, chatId);

      await this.bot?.sendMessage(
        chatId,
        'Спасибо! Теперь вы можете вернуться на сайт и завершить вход.',
      );
    });
  }

  /** Доступна ли отправка (есть токен и экземпляр бота). */
  canSendMessages(): boolean {
    return this.bot != null;
  }

  async sendOtpCode(chatId: string, code: string) {
    if (!this.bot) {
      throw new Error('Telegram bot не инициализирован (нет TELEGRAM_BOT_TOKEN)');
    }

    await this.bot.sendMessage(chatId, `🔐 Ваш код: ${code}`);
  }
}

