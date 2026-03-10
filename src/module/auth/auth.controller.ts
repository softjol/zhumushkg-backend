import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { CreateUserDto } from '../user/dto/user.dto';
import { RefId } from '../../decorators/ref.decorator';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: CustomLogger,
  ) {}

  @Post('register')
  async register(@Body() userData: CreateUserDto, @RefId() refId: string) {
    this.logger.debug(
      `[CONTROLLER] register: ${JSON.stringify(userData)}`,
      refId,
    );
    try {
      const user = await this.authService.register(userData, refId);
      if (user) {
        this.logger.debug(
          `[CONTROLLER] register SUCCESS: ${user.email}`,
          refId,
        );
      }
      return user;
    } catch (error) {
      this.logger.error(`[CONTROLLER] register failed: ${error}`, refId);
      throw error;
    }
  }

  @Get('profile/:id')
  async getProfile(@Param('id') id: number, @RefId() refId: string) {
    this.logger.debug(`[CONTROLLER] get profile`, refId);
    try {
      // Здесь должна быть логика получения профиля пользователя
      this.logger.debug(`[CONTROLLER] get profile SUCCESS`, refId);
      const user = await this.authService.getProfile(id, refId);
      return user;
    } catch (error) {
      this.logger.error(`[CONTROLLER] get profile failed: ${error}`, refId);
      throw error;
    }
  }

  @Get('confirm-email')
  async confirmEmail(@Query('token') token: string, @RefId() refId: string) {
    const user = await this.authService.findByConfirmationToken(token, refId);

    if (!user) {
      throw new BadRequestException('Неверный токен подтверждения');
    }

    user.emailConfirmed = true;
    user.emailConfirmationToken = null;

    await this.authService.save(user);

    return { message: 'Email успешно подтверждён' };
  }

  @Post('login')
  async login(@Body() login: LoginDto, @RefId() refId: string) {
    this.logger.debug(`[CONTROLLER] login`, refId);
    try {
      const user = await this.authService.login(login, refId);
      this.logger.debug(`[CONTROLLER] login SUCCESS`, refId);
      return user;
    } catch (error) {
      this.logger.error(`[CONTROLLER] login failed: ${error}`, refId);
      throw error;
    }
  }
}
