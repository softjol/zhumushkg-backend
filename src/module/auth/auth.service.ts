import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { CreateUserDto } from '../user/dto/user.dto';
import { UserEntity } from '../database/entitis/user.entity';
import { RefreshTokenEntity } from '../database/entitis/refresh-token.entity';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { SwitchRoleDto } from '../user/dto/switch-role.dto';
import { randomUUID } from 'crypto';

const REFRESH_TTL_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly logger: CustomLogger,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepo: Repository<RefreshTokenEntity>,
  ) {}

  // ─── Вспомогательные методы ───────────────────────────────────────────────

  private buildPayload(user: UserEntity) {
    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role.role,
      phoneConfirmed: user.phoneConfirmed,
      firstName: user.firstName,
      isBanned: user.isBanned,
    };
  }

  private async generateTokens(user: UserEntity) {
    const payload = this.buildPayload(user);
    const access_token = this.jwtService.sign(payload);

    // Создаём refresh токен — случайный UUID, храним в БД
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);

    await this.refreshTokenRepo.save({
      token,
      userId: user.id,
      expiresAt,
    });

    return { access_token, refresh_token: token };
  }

  // ─── Auth endpoints ───────────────────────────────────────────────────────

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
        // OTP TTL проверяется через in-memory rate-limit в user.service
        const codeExpired = false;

        if (codeExpired) {
          this.logger.warn(
            `[WARN] Unconfirmed user expired, deleting: ${userData.phoneNumber}`,
            refId,
          );
          await this.userService.removeById(existingUser.id, refId);
        } else {
          throw new HttpException(
            existingUser.phoneConfirmed
              ? `Пользователь с таким номером уже зарегистрирован`
              : `Код подтверждения уже отправлен. Подождите 3 минуты перед повторной регистрацией`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const user = await this.userService.createUser(userData, refId);
      this.logger.debug(
        `[SUCCESS] User registered with phoneNumber: ${JSON.stringify(userData.phoneNumber)}`,
        refId,
      );

      return {
        message:
          'Вы успешно зарегистрированы. Введите код подтверждения для активации аккаунта.',
        user: {
          id: user.id,
          firstName: user.firstName,
          phoneNumber: user.phoneNumber,
        },
      };
    } catch (error) {
      this.logger.error(
        `[ERROR] Registering user: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async confirmPhone(phoneNumber: string, code: string, refId: string) {
    try {
      const phone = phoneNumber.toString().trim();
      const user = phone
        ? await this.userService.findByPhoneAndSmsCode(phoneNumber, code, refId)
        : await this.userService.findByPhoneConfirmationToken(code, refId);

      if (!user) {
        throw new HttpException(
          'Неверный код или номер телефона',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (user.isBanned) {
        throw new HttpException(
          'Пользователь заблокирован',
          HttpStatus.FORBIDDEN,
        );
      }

      user.phoneConfirmed = true;
      user.smsCode = null;
      await this.userService.save(user);

      // Загружаем с role relation если нет
      const fullUser = await this.userService.findOneById(user.id, refId);
      const tokens = await this.generateTokens(fullUser!);

      this.logger.debug(
        `[SUCCESS] confirmPhone: tokens issued for ${phoneNumber}`,
        refId,
      );
      return tokens;
    } catch (error) {
      this.logger.error(
        `[ERROR] Confirming phone for ${phoneNumber}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async refresh(refreshToken: string, refId: string) {
    this.logger.debug(`[SERVICE] refresh token`, refId);

    const record = await this.refreshTokenRepo.findOne({
      where: { token: refreshToken },
    });

    if (!record) {
      throw new UnauthorizedException('Refresh токен не найден');
    }

    if (new Date() > record.expiresAt) {
      await this.refreshTokenRepo.delete(record.id);
      throw new UnauthorizedException('Refresh токен истёк. Войдите снова');
    }

    const user = await this.userService.findOneById(record.userId, refId);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    if (user.isBanned) {
      throw new UnauthorizedException('Пользователь заблокирован');
    }

    // Удаляем старый refresh и выдаём новую пару токенов (rotation)
    await this.refreshTokenRepo.delete(record.id);
    const tokens = await this.generateTokens(user);

    this.logger.debug(
      `[SUCCESS] refresh: new tokens issued for userId=${user.id}`,
      refId,
    );
    return tokens;
  }

  async logout(refreshToken: string, refId: string) {
    this.logger.debug(`[SERVICE] logout`, refId);
    await this.refreshTokenRepo.delete({ token: refreshToken });
    this.logger.debug(`[SUCCESS] logout: refresh token deleted`, refId);
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
    await this.userService.updateSmsCodeAndSend(phoneNumber, refId);
    this.logger.debug(
      `[SUCCESS] requestCode: code sent to ${phoneNumber}`,
      refId,
    );
    return { message: 'Код подтверждения отправлен на WhatsApp' };
  }

  async switchRole(userId: number, dto: SwitchRoleDto, refId: string) {
    this.logger.debug(
      `[SERVICE] switchRole userId=${userId} -> ${dto.role}`,
      refId,
    );
    const user = await this.userService.switchUserRole(userId, dto.role, refId);
    const tokens = await this.generateTokens(user);
    return { ...tokens, user };
  }

  async login(login: LoginDto, refId: string) {
    this.logger.debug(
      `[SERVICE] login with phoneNumber: ${JSON.stringify(login.phoneNumber)}`,
      refId,
    );
    try {
      return this.requestCode(login.phoneNumber, refId);
    } catch (error) {
      this.logger.error(`[ERROR] login: ${JSON.stringify(error)}`, refId);
      throw error;
    }
  }

  async getProfile(id: number, refId: string) {
    this.logger.debug(`[SERVICE] Get profile`, refId);
    try {
      return await this.userService.findOneById(id, refId);
    } catch (error) {
      this.logger.error(`[ERROR] Get profile: ${JSON.stringify(error)}`, refId);
      throw error;
    }
  }

  async save(user: UserEntity) {
    return this.userService.save(user);
  }
}
