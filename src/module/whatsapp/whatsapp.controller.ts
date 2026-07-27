import { Body, Controller, Get, Logger, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';

@ApiExcludeController()
@Controller('whatsapp/webhook')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  // Meta вызывает это при настройке Webhooks в App Dashboard
  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    if (mode === 'subscribe' && this.whatsappService.isVerifyTokenValid(token)) {
      this.logger.log('✅ WhatsApp webhook подтверждён');
      res.status(200).send(challenge);
      return;
    }

    this.logger.warn('❌ WhatsApp webhook: неверный verify_token');
    res.sendStatus(403);
  }

  // Входящие сообщения и статусы доставки
  @Post()
  receive(@Body() body: unknown, @Res() res: Response) {
    this.logger.debug(`[WhatsApp] Webhook событие: ${JSON.stringify(body)}`);
    // Meta требует быстрый ответ 200, иначе будет ретраить доставку
    res.sendStatus(200);
  }
}
