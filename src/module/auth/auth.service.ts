import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CustomLogger } from 'src/helpers/logger/logger.service';
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
      `[SERVICE] Registering user with email: ${JSON.stringify(userData.email)}`,
      refId,
    );

    try {
      const exstingUser = await this.userService.findOneByEmail(
        userData.email,
        refId,
      );
      if (exstingUser) {
        this.logger.warn(
          `[WARN] User with email ${JSON.stringify(userData.email)}`,
          refId,
        );
        throw new HttpException(
          `Пользователь с таким email уже существует`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = await this.userService.createUser(userData, refId);
      this.logger.debug(
        `[SUCCESS] User registered with email: ${JSON.stringify(userData.email)}`,
        refId,
      );
      return user;
    } catch (error) {
      this.logger.error(
        `[ERROR] Registering user with email: ${JSON.stringify(error)}`,
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

  async findByConfirmationToken(token: string, refId: string) {
    return this.userService.findByConfirmationToken(token, refId);
  }

  async save(user: UserEntity) {
    return this.userService.save(user);
  }

  async login(login: LoginDto, refId: string) {
    this.logger.debug(
      `[SERVICE] login with email: ${JSON.stringify(login.email)}`,
      refId,
    );
    try {
      const user = await this.userService.findOneByEmail(login.email, refId);
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

      if (user && passwordEqual) {
        const payload = {
          email: user.email,
          id: user.id,
          role: user.role.role,
          emailConfirmed: user.emailConfirmed,
          full_name: user.fullName,
        };
        return {
          access_token: this.jwtService.sign(payload),
        };
      }
      this.logger.debug(`[SERVICE] login SUCCESS`, refId);
      return user;
    } catch (error) {
      this.logger.error(
        `[ERROR] login with email: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }
}
