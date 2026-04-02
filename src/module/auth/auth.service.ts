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
      // Проверка совпадения пароля и подтверждения пароля
      if (userData.password !== userData.confirm_password) {
        throw new HttpException(`Пароли не совпадают`, HttpStatus.BAD_REQUEST);
      }

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

  async save(user: UserEntity) {
    return this.userService.save(user);
  }

  async login(login: LoginDto, refId: string) {
    this.logger.debug(
      `[SERVICE] login with phoneNumber: ${JSON.stringify(login.phoneNumber)}`,
      refId,
    );
    try {
      const user = await this.userService.findOneByPhoneNumber(
        login.phoneNumber,
        refId,
      );
      if (!user) {
        throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
      }

      const passwordEqual = await bcrypt.compare(
        login.password,
        user?.password || '',
      );
      if (!passwordEqual) {
        throw new HttpException('Неверный пароль', HttpStatus.UNAUTHORIZED);
      }

      if (!user.phoneConfirmed) {
        throw new HttpException(
          'Номер телефона не подтвержден',
          HttpStatus.FORBIDDEN,
        );
      }

      if (user && passwordEqual) {
        const payload = {
          phoneNumber: user.phoneNumber,
          id: user.id,
          role: user.role.role,
          phoneConfirmed: user.phoneConfirmed,
          full_name: user.fullName,
        };
        return {
          access_token: this.jwtService.sign(payload),
        };
      }
      this.logger.debug(`[SERVICE] login SUCCESS`, refId);
      return {
        access_token: this.jwtService.sign(payload),
      };
    } catch (error) {
      this.logger.error(
        `[ERROR] login with phoneNumber: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }
}
