import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  private readonly apiVersion = process.env.WHATSAPP_API_VERSION ?? 'v21.0';
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? '';
  private readonly accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? '';
  private readonly verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? '';
  private readonly otpTemplateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME ?? '';
  private readonly otpTemplateLang =
    process.env.WHATSAPP_OTP_TEMPLATE_LANG ?? 'ru';

  private get apiUrl(): string {
    return `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
  }

  isVerifyTokenValid(token: string): boolean {
    return !!this.verifyToken && token === this.verifyToken;
  }

  private async post(body: Record<string, unknown>): Promise<void> {
    if (!this.phoneNumberId || !this.accessToken) {
      this.logger.warn(
        'WHATSAPP_PHONE_NUMBER_ID/WHATSAPP_ACCESS_TOKEN не заданы — сообщение не отправлено',
      );
      return;
    }

    const res = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      this.logger.error(
        `[WhatsApp] Ошибка HTTP ${res.status}: ${JSON.stringify(data)}`,
      );
      throw new Error(
        `WhatsApp API error ${res.status}: ${JSON.stringify(data)}`,
      );
    }

    this.logger.debug(`[WhatsApp] Ответ: ${JSON.stringify(data)}`);
  }

  async sendMessage(phoneNumber: string, text: string): Promise<void> {
    const to = phoneNumber.replace(/\D/g, '');

    await this.post({
      to,
      type: 'text',
      text: { body: text },
    });

    this.logger.log(`📤 WhatsApp → ${phoneNumber}: отправлено`);
  }

  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    const to = phoneNumber.replace(/\D/g, '');

    // Business-initiated сообщения вне 24-часового окна требуют
    // одобренный Meta шаблон категории "Authentication".
    if (this.otpTemplateName) {
      await this.post({
        to,
        type: 'template',
        template: {
          name: this.otpTemplateName,
          language: { code: this.otpTemplateLang },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: code }],
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [{ type: 'text', text: code }],
            },
          ],
        },
      });
      this.logger.log(`📤 WhatsApp OTP (шаблон) → ${phoneNumber}: отправлено`);
      return;
    }

    // Без одобренного шаблона: работает только для тестовых номеров,
    // добавленных в Meta App Dashboard, или внутри 24ч окна диалога.
    const text =
      `🔐 Ваш код подтверждения на Жумуш.кг:\n\n` +
      `*${code}*\n\n` +
      `Никому не сообщайте этот код.`;

    await this.sendMessage(to, text);
  }
}
