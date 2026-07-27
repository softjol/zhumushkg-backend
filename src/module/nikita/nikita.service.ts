import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NikitaService {
  private readonly logger = new Logger(NikitaService.name);
  private readonly login = process.env.NIKITA_LOGIN ?? '';
  private readonly password = process.env.NIKITA_PASSWORD ?? '';
  private readonly sender = process.env.NIKITA_SENDER ?? 'SMSPRO.KG';

  async sendSms(phoneNumber: string, message: string): Promise<void> {
    const phone = this.normalizePhone(phoneNumber);

    // Nikita XML/HTTP протокол — логин и пароль от личного кабинета
    const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<message>
  <login>${this.login}</login>
  <pwd>${this.password}</pwd>
  <id>1</id>
  <sender>${this.sender}</sender>
  <text>${message}</text>
  <phones>
    <phone>${phone}</phone>
  </phones>
</message>`;

    this.logger.debug(`[Nikita] Отправка SMS на ${phone}`);

    const res = await fetch('https://smspro.nikita.kg/api/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xmlBody,
    });

    const text = await res.text();
    this.logger.debug(`[Nikita] Ответ: ${text}`);

    if (!res.ok) {
      this.logger.error(`[Nikita] Ошибка HTTP ${res.status}: ${text}`);
      throw new Error(`Nikita SMS error ${res.status}: ${text}`);
    }

    // Nikita: <status>0</status> = ошибка, всё остальное = успех (1=принято, 2=в очереди)
    const statusMatch = text.match(/<status>(\d+)<\/status>/);
    const status = statusMatch ? parseInt(statusMatch[1], 10) : -1;

    if (status > 0) {
      this.logger.debug(`[Nikita] SMS принято (status=${status}) на ${phone}`);
      return;
    }

    this.logger.error(`[Nikita] Ошибка в ответе (status=${status}): ${text}`);
    throw new Error(`Nikita SMS failed (status=${status})`);
  }

  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    const message = `Ваш код подтверждения: ${code}`;
    await this.sendSms(phoneNumber, message);
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');

    // 0XXXXXXXXX → 996XXXXXXXXX
    if (digits.startsWith('0') && digits.length === 10) {
      return '996' + digits.slice(1);
    }

    // +996XXXXXXXXX → 996XXXXXXXXX
    if (digits.startsWith('996') && digits.length === 12) {
      return digits;
    }

    return digits;
  }
}
