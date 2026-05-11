import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { UserEntity } from '../database/entitis/user.entity';
import { RoleEntity } from '../database/entitis/role.entity';
import { AppUserRole } from '../../common/constants/app-user-role';
import * as twilio from 'twilio';
import { TelegramBotService } from '../telegram/telegram-bot.service';
import { TelegramLinkService } from '../telegram/telegram-link.service';
import { randomInt } from 'crypto';

@Injectable()
export class UserService {
  private twilioClient: any;

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly logger: CustomLogger,
    private readonly telegramBotService: TelegramBotService,
    private readonly telegramLinkService: TelegramLinkService,
  ) {
    // Инициализация Twilio клиента
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken) {
      this.twilioClient = twilio.default(accountSid, authToken);
    }
  }

  async findOneByPhoneNumber(phoneNumber: string, refId: string) {
    this.logger.debug(
      `[SERVICE] find one by phoneNumber ${JSON.stringify(phoneNumber)}`,
      refId,
    );
    try {
      this.logger.debug(
        `[SUCCESS] find one by phoneNumber ${JSON.stringify(phoneNumber)}`,
        refId,
      );

      return this.userRepository.findOne({
        where: { phoneNumber },
        relations: ['role'],
      });
    } catch (error) {
      this.logger.error(
        `[ERROR] find one by phoneNumber ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async removeById(id: number, refId: string) {
    this.logger.debug(`[SERVICE] remove by id ${JSON.stringify(id)}`, refId);
    try {
      this.logger.debug(`[SUCCESS] remove by id ${JSON.stringify(id)}`, refId);
      await this.userRepository.delete(id);
      return { message: `Пользователь с id ${id} удален успешно` };
    } catch (error) {
      this.logger.error(`[ERROR] remove by id ${JSON.stringify(error)}`, refId);
      throw error;
    }
  }

  private generateSmsCode(): string {
    return randomInt(1000, 10000).toString();
  }

  /** Гарантирует строки ролей соискатель / работодатель в таблице role. */
  async ensureAppRoles(refId: string): Promise<void> {
    const pairs: [AppUserRole, string][] = [
      [AppUserRole.JOB_SEEKER, 'Соискатель'],
      [AppUserRole.EMPLOYER, 'Работодатель'],
    ];
    for (const [roleName, description] of pairs) {
      const existing = await this.roleRepository.findOne({
        where: { role: roleName },
      });
      if (!existing) {
        await this.roleRepository.save({ role: roleName, description });
        this.logger.debug(`[SERVICE] Created role ${roleName}`, refId);
      }
    }
  }

  /**
   * Переключение только между соискателем и работодателем.
   * Роль USER (legacy) считается соискателем.
   */
  async switchUserRole(
    userId: number,
    targetRole: AppUserRole,
    refId: string,
  ): Promise<UserEntity> {
    await this.ensureAppRoles(refId);
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException(`Пользователь #${userId} не найден`);
    }
    const currentName = user.role?.role ?? '';
    const effective: AppUserRole =
      currentName === 'USER'
        ? AppUserRole.JOB_SEEKER
        : (currentName as AppUserRole);

    if (
      effective !== AppUserRole.JOB_SEEKER &&
      effective !== AppUserRole.EMPLOYER
    ) {
      throw new BadRequestException(
        'Переключение роли доступно только для соискателя и работодателя',
      );
    }
    if (effective === targetRole) {
      return user;
    }
    if (
      (effective === AppUserRole.JOB_SEEKER &&
        targetRole !== AppUserRole.EMPLOYER) ||
      (effective === AppUserRole.EMPLOYER &&
        targetRole !== AppUserRole.JOB_SEEKER)
    ) {
      throw new BadRequestException(
        'Можно переключаться только между соискателем (JOB_SEEKER) и работодателем (EMPLOYER)',
      );
    }

    const nextRole = await this.roleRepository.findOne({
      where: { role: targetRole },
    });
    if (!nextRole) {
      throw new BadRequestException(`Роль ${targetRole} не найдена в БД`);
    }
    user.role = nextRole;
    await this.userRepository.save(user);
    const reloaded = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!reloaded) {
      throw new NotFoundException(`Пользователь #${userId} не найден`);
    }
    return reloaded;
  }

  async sendConfirmationSMS(
    phoneNumber: string,
    smsCode: string,
    refId: string,
  ) {
    await this.trySendConfirmationTelegram(phoneNumber, smsCode, refId);

    try {
      if (!this.twilioClient) {
        this.logger.error(
          'Twilio не настроен. Установите TWILIO_ACCOUNT_SID и TWILIO_AUTH_TOKEN',
          '',
        );
        // В production не логируем OTP-коды.
        this.logger.warn(
          `Twilio не настроен. OTP не отправлен для ${phoneNumber}`,
          refId,
        );
        return;
      }

      await this.twilioClient.messages.create({
        body: `Ваш код подтверждения: ${smsCode}. Не делитесь этим кодом с никем!`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });

      this.logger.debug(`SMS sent to ${phoneNumber}`, '');
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}: ${error}`, '');
    }
  }

  private async trySendConfirmationTelegram(
    phoneNumber: string,
    smsCode: string,
    refId: string,
  ) {
    if (!this.telegramBotService.canSendMessages()) {
      return;
    }
    try {
      const chatId =
        await this.telegramLinkService.findChatIdByPhone(phoneNumber);
      if (!chatId) {
        this.logger.debug(
          `[Telegram] Нет привязки для ${phoneNumber}, код только SMS/лог`,
          refId,
        );
        return;
      }
      await this.telegramBotService.sendOtpCode(chatId, smsCode);
      this.logger.debug(
        `[Telegram] Код подтверждения отправлен в чат ${chatId}`,
        refId,
      );
    } catch (e) {
      this.logger.error(
        `[Telegram] Не удалось отправить код: ${String(e)}`,
        refId,
      );
    }
  }

  async createUser(userData: CreateUserDto, refId: string) {
    this.logger.debug(
      `[SERVICE] Creating user with phoneNumber: ${JSON.stringify(userData.phoneNumber)}`,
      refId,
    );
    try {
      this.logger.debug(
        `[SUCCESS] Creating user with phoneNumber: ${JSON.stringify(userData.phoneNumber)}`,
        refId,
      );

      await this.ensureAppRoles(refId);
      const targetRole = userData.role ?? AppUserRole.JOB_SEEKER;
      const role = await this.roleRepository.findOne({
        where: { role: targetRole },
      });
      if (!role) {
        throw new BadRequestException(
          `Роль ${targetRole} не найдена после инициализации`,
        );
      }

      const smsCode = this.generateSmsCode();

      const user = await this.userRepository.create({
        firstName: userData.firstName,
        phoneNumber: userData.phoneNumber,
        role: role,
        phoneConfirmed: false,
        smsCode: smsCode,
        isBanned: false,
      });

      const savedUser = await this.userRepository.save(user);
      await this.sendConfirmationSMS(savedUser.phoneNumber, smsCode, refId);
      return savedUser;
    } catch (error) {
      this.logger.error(
        `[ERROR] Creating user with phoneNumber: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async findOneById(decoded: number, refId: string) {
    this.logger.debug(
      `[SERVICE] find one by id ${JSON.stringify(decoded)}`,
      refId,
    );

    try {
      this.logger.debug(
        `[SUCCESS] find one by id ${JSON.stringify(decoded)}`,
        refId,
      );
      const user = await this.userRepository.findOne({
        where: { id: decoded },
        relations: ['role'],
      });

      return user;
    } catch (error) {
      this.logger.error(
        `[ERROR] find one by id ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async findByPhoneConfirmationToken(smsCode: string, refId: string) {
    this.logger.debug(`[SERVICE] find by SMS code`, refId);
    try {
      return this.userRepository.findOne({
        where: { smsCode: smsCode },
        relations: ['role'],
      });
    } catch (error) {
      this.logger.error(
        `[ERROR] find by SMS code ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async findByPhoneAndSmsCode(
    phoneNumber: string,
    smsCode: string,
    refId: string,
  ) {
    this.logger.debug(`[SERVICE] find by phone + SMS code`, refId);
    try {
      return this.userRepository.findOne({
        where: { phoneNumber, smsCode },
        relations: ['role'],
      });
    } catch (error) {
      this.logger.error(
        `[ERROR] find by phone + SMS code ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async findByConfirmationToken(smsCode: string) {
    return this.userRepository.findOne({
      where: { smsCode: smsCode },
    });
  }

  async save(user: UserEntity) {
    return this.userRepository.save(user);
  }

  async updateSmsCodeAndSend(phoneNumber: string, refId: string) {
    const user = await this.findOneByPhoneNumber(phoneNumber, refId);
    if (!user) {
      throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
    }
    if (user.isBanned) {
      throw new HttpException(
        'Пользователь заблокирован',
        HttpStatus.FORBIDDEN,
      );
    }
    const newCode = this.generateSmsCode();
    user.smsCode = newCode;
    await this.save(user);
    await this.sendConfirmationSMS(phoneNumber, newCode, refId);
    return newCode;
  }

  async setBanStatus(userId: number, refId: string): Promise<UserEntity> {
    const user = await this.findOneById(userId, refId);
    if (!user) {
      throw new NotFoundException(`Пользователь #${userId} не найден`);
    }
    user.isBanned = !user.isBanned;
    return await this.userRepository.save(user);
  }

  async getUsersByRoleWithRelations(role: AppUserRole, refId: string) {
    this.logger.debug(`[SERVICE] get users by role ${role}`, refId);
    const relation = role === AppUserRole.JOB_SEEKER ? 'resumes' : 'vacancies';
    return await this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'r')
      .leftJoinAndSelect(`u.${relation}`, relation)
      .where('r.role = :role', { role })
      .orderBy('u.id', 'DESC')
      .getMany();
  }
}
