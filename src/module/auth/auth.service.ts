import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { CreateUserDto } from '../user/dto/user.dto';
import { UserEntity } from '../database/entitis/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly logger: CustomLogger,
    private jwtService: JwtService,
  ) {}

  async register(userData: CreateUserDto, refId: string) {
    this.logger.debug(
      `[SERVICE] Registering user with phoneNumber: ${JSON.stringify(userData.phoneNumber)}`,
      refId,
    );

    try {
      const existingUser = await this.userService.findOneByPhoneNumber(
        userData.phoneNumber,
        refId,
      );
      if (existingUser) {
        this.logger.warn(
          `[WARN] User with phoneNumber ${JSON.stringify(userData.phoneNumber)}`,
          refId,
        );
        throw new HttpException(
          `Пользователь с таким номером телефона уже существует`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = await this.userService.createUser(userData, refId);
      this.logger.debug(
        `[SUCCESS] User registered with phoneNumber: ${JSON.stringify(userData.phoneNumber)}`,
        refId,
      );
      return user;
    } catch (error) {
      this.logger.error(
        `[ERROR] Registering user with phoneNumber: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async getProfile(id: number, refId: string) {
    this.logger.debug(`[SERVICE] Get profile`, refId);
    try {
      // Здесь должна быть логика получения профиля пользователя
      this.logger.debug(`[SUCCESS] Get profile`, refId);
      console.log(id);

      const user = await this.userService.findOneById(id, refId);

      return user;
    } catch (error) {
      this.logger.error(`[ERROR] Get profile: ${JSON.stringify(error)}`, refId);
      throw error;
    }
  }

  async findByConfirmationToken(smsCode: string, refId: string) {
    return this.userService.findByPhoneConfirmationToken(smsCode, refId);
  }

  async findByPhoneAndConfirmationCode(
    phoneNumber: string,
    code: string,
    refId: string,
  ) {
    return this.userService.findByPhoneAndSmsCode(phoneNumber, code, refId);
  }

  async confirmPhone(phoneNumber: string, code: string, refId: string) {
    try {
      const phone = phoneNumber.toString().trim();
      const user = phone
        ? await this.findByPhoneAndConfirmationCode(phoneNumber, code, refId)
        : await this.findByConfirmationToken(code, refId);

      if (!user) {
        throw new HttpException(
          'Неверный код или номер телефона',
          HttpStatus.BAD_REQUEST,
        );
      }

      user.phoneConfirmed = true;
      user.smsCode = null;

      await this.save(user);
      const payload = {
        phoneNumber: user.phoneNumber,
        id: user.id,
        role: user.role.role,
        phoneConfirmed: user.phoneConfirmed,
        firstName: user.firstName,
      };
      return {
        access_token: this.jwtService.sign(payload),
      };
    } catch (error) {
      this.logger.error(
        `[ERROR] Confirming phone for ${phoneNumber}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async save(user: UserEntity) {
    return this.userService.save(user);
  }

  async requestCode(phoneNumber: string, refId: string) {
    this.logger.debug(`[SERVICE] requestCode for ${phoneNumber}`, refId);
    const user = await this.userService.findOneByPhoneNumber(
      phoneNumber,
      refId,
    );
    if (!user) {
      throw new HttpException(
        'Пользователь с таким номером не найден',
        HttpStatus.NOT_FOUND,
      );
    }
    // Генерируем новый код и отправляем
    const code = await this.userService.updateSmsCodeAndSend(phoneNumber, refId);
    this.logger.debug(
      `[SUCCESS] requestCode: code sent to ${phoneNumber}`,
      refId,
    );
    return { message: 'Код подтверждения отправлен', smsCode: code };
  }

  async login(login: LoginDto, refId: string) {
    this.logger.debug(
      `[SERVICE] login with phoneNumber: ${JSON.stringify(login.phoneNumber)}`,
      refId,
    );
    try {
      return this.requestCode(login.phoneNumber, refId);
    } catch (error) {
      this.logger.error(
        `[ERROR] login with phoneNumber: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }
}
