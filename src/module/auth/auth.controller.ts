import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { CreateUserDto } from '../user/dto/user.dto';
import { RefId } from '../../decorators/ref.decorator';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
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
          `[CONTROLLER] register SUCCESS: ${user.phoneNumber}`,
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

  @Post('confirm-phone')
  async confirmPhone(
    @Body() body: { smsCode: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] confirm phone`, refId);
    try {
      const user = await this.authService.findByConfirmationToken(
        body.smsCode,
        refId,
      );

      if (!user) {
        throw new BadRequestException('Неверный код подтверждения');
      }

      user.phoneConfirmed = true;
      user.smsCode = null;

      await this.authService.save(user);

      this.logger.debug(`[CONTROLLER] confirm phone SUCCESS`, refId);
      return { message: 'Номер телефона успешно подтвержден' };
    } catch (error) {
      this.logger.error(`[CONTROLLER] confirm phone failed: ${error}`, refId);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Вход — access_token для Swagger Authorize' })
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
