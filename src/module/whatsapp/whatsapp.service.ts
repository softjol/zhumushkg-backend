import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as path from 'path';

/** Обёртка для ESM-импорта в CommonJS проекте.
 *  new Function(...) непрозрачен для tsc → не превращается в require(). */
const esmImport = new Function('pkg', 'return import(pkg)') as (
  pkg: string,
) => Promise<any>;

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);
  private sock: any = null;
  private isReady = false;

  async onModuleInit() {
    await this.connect();
  }

  private async connect() {
    const baileys = await esmImport('@whiskeysockets/baileys');
    const { default: qrcode } = await esmImport('qrcode-terminal');
    const { Boom } = await esmImport('@hapi/boom');

    const makeWASocket = baileys.default ?? baileys.makeWASocket ?? baileys;
    const useMultiFileAuthState = baileys.useMultiFileAuthState;
    const DisconnectReason = baileys.DisconnectReason;

    const authFolder = path.resolve(process.cwd(), 'whatsapp-session');
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    this.sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: {
        level: 'silent',
        trace: () => {},
        debug: () => {},
        info: () => {},
        warn: (msg: any) => this.logger.warn(JSON.stringify(msg)),
        error: (msg: any) => this.logger.error(JSON.stringify(msg)),
        fatal: (msg: any) => this.logger.error(JSON.stringify(msg)),
        child: () => ({
          level: 'silent',
          trace: () => {},
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {},
          fatal: () => {},
          child: () => ({}) as any,
        }),
      } as any,
    });

    this.sock.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.logger.warn('======= ОТСКАНИРУЙТЕ QR В WHATSAPP =======');
        qrcode.generate(qr, { small: true });
        this.logger.warn('===========================================');
      }

      if (connection === 'open') {
        this.isReady = true;
        this.logger.log('✅ WhatsApp подключён');
      }

      if (connection === 'close') {
        this.isReady = false;
        const statusCode = (lastDisconnect?.error as InstanceType<typeof Boom>)
          ?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        this.logger.warn(
          `WhatsApp отключён (код ${statusCode}). Переподключение: ${shouldReconnect}`,
        );

        if (shouldReconnect) {
          setTimeout(() => this.connect(), 5000);
        }
      }
    });

    this.sock.ev.on('creds.update', saveCreds);
  }

  isConnected(): boolean {
    return this.isReady;
  }

  async sendMessage(phoneNumber: string, text: string): Promise<void> {
    if (!this.sock || !this.isReady) {
      this.logger.warn(
        `WhatsApp не подключён — сообщение на ${phoneNumber} не отправлено`,
      );
      return;
    }

    const jid = phoneNumber.replace(/\D/g, '') + '@s.whatsapp.net';
    await this.sock.sendMessage(jid, { text });
    this.logger.log(`📤 WhatsApp → ${phoneNumber}: отправлено`);
  }

  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    const text =
      `🔐 Ваш код подтверждения на Жумуш.кг:\n\n` +
      `*${code}*\n\n` +
      `Никому не сообщайте этот код.`;

    await this.sendMessage(phoneNumber, text);
  }
}
