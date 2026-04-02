import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { UserEntity } from '../database/entitis/user.entity';
import { RoleEntity } from '../database/entitis/role.entity';
import * as twilio from 'twilio';

@Injectable()
export class UserService {
  private twilioClient: any;

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly logger: CustomLogger,
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

  async findOneByEmail(email: string, refId: string) {
    this.logger.debug(
      `[SERVICE] find one by email ${JSON.stringify(email)}`,
      refId,
    );
    try {
      this.logger.debug(
        `[SUCCESS] find one by email ${JSON.stringify(email)}`,
        refId,
      );

      return this.userRepository.findOne({
        where: { email },
        relations: ['role'],
      });
    } catch (error) {
      this.logger.error(
        `[ERROR] find one by email ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  private generateSmsCode(): string {
    // Генерируем 6-цифровой код
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendConfirmationSMS(phoneNumber: string, smsCode: string) {
    try {
      if (!this.twilioClient) {
        // Если Twilio не настроен, только логируем
        this.logger.error(
          'Twilio не настроен. Установите TWILIO_ACCOUNT_SID и TWILIO_AUTH_TOKEN',
          '',
        );
        console.log(`SMS Code для ${phoneNumber}: ${smsCode}`);
        return;
      }

      // Отправляем SMS через Twilio
      await this.twilioClient.messages.create({
        body: `Ваш код подтверждения: ${smsCode}. Не делитесь этим кодом с никем!`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });

      this.logger.debug(`SMS sent to ${phoneNumber}`, '');
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}: ${error}`, '');
      // Не прерываем процесс регистрации если SMS не отправилась
      console.log(`SMS Code для ${phoneNumber}: ${smsCode}`);
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
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      let role = await this.roleRepository.findOne({ where: { role: 'USER' } });

      if (!role) {
        role = await this.roleRepository.save({
          role: 'USER',
          description: 'Роль по умолчанию',
        });
      }

      const smsCode = this.generateSmsCode();

      const user = await this.userRepository.create({
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber,
        password: hashedPassword,
        role: role,
        phoneConfirmed: false,
        smsCode: smsCode,
      });

      const savedUser = await this.userRepository.save(user);
      await this.sendConfirmationSMS(savedUser.phoneNumber, smsCode);
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
      });
    } catch (error) {
      this.logger.error(
        `[ERROR] find by SMS code ${JSON.stringify(error)}`,
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
}
