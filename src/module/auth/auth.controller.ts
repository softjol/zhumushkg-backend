import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { CreateUserDto } from '../user/dto/user.dto';
import { RefId } from '../../decorators/ref.decorator';
import { LoginDto } from './dto/login.dto';
import { ConfirmPhoneDto } from './dto/confirm-phone.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SwitchRoleDto } from '../user/dto/switch-role.dto';
import { CurrentUser } from '../../decorators/current-user.decorator';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_TTL_DAYS = 30;

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true, // JS не может прочитать
    secure: process.env.NODE_ENV === 'production', // HTTPS только в prod
    sameSite: 'strict',
    maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: CustomLogger,
  ) {}

  @ApiOperation({ summary: '1. Регистрация → получить код на WhatsApp' })
  @Post('register')
  async register(@Body() userData: CreateUserDto, @RefId() refId: string) {
    this.logger.debug(
      `[CONTROLLER] register: ${JSON.stringify(userData)}`,
      refId,
    );
    try {
      const result = await this.authService.register(userData, refId);
      this.logger.debug(
        `[CONTROLLER] register SUCCESS: ${result.user.phoneNumber}`,
        refId,
      );
      return result;
    } catch (error) {
      this.logger.error(`[CONTROLLER] register failed: ${error}`, refId);
      throw error;
    }
  }

  @ApiOperation({
    summary:
      '2. Подтверждение телефона → access_token + refresh_token (cookie)',
  })
  @Post('confirm-phone')
  async confirmPhone(
    @Body() dto: ConfirmPhoneDto,
    @Res({ passthrough: true }) res: Response,
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] confirm phone`, refId);
    try {
      const code = (dto?.code ?? dto?.smsCode)?.trim();
      if (!code || !dto.phoneNumber) {
        throw new BadRequestException('Передайте phoneNumber и code');
      }

      const { access_token, refresh_token } =
        await this.authService.confirmPhone(dto.phoneNumber, code, refId);

      setRefreshCookie(res, refresh_token);

      this.logger.debug(`[CONTROLLER] confirm phone SUCCESS`, refId);
      return { access_token };
    } catch (error) {
      this.logger.error(`[CONTROLLER] confirm phone failed: ${error}`, refId);
      throw error;
    }
  }

  @ApiOperation({ summary: '3. Вход по номеру телефона → код на WhatsApp' })
  @Post('login')
  async login(@Body() login: LoginDto, @RefId() refId: string) {
    this.logger.debug(`[CONTROLLER] login`, refId);
    try {
      const result = await this.authService.login(login, refId);
      this.logger.debug(`[CONTROLLER] login SUCCESS`, refId);
      return result;
    } catch (error) {
      this.logger.error(`[CONTROLLER] login failed: ${error}`, refId);
      throw error;
    }
  }

  @ApiOperation({
    summary: '4. Обновить access_token используя refresh_token из cookie',
  })
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] refresh`, refId);
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) {
      throw new UnauthorizedException('Refresh токен отсутствует');
    }

    try {
      const { access_token, refresh_token } = await this.authService.refresh(
        token,
        refId,
      );
      setRefreshCookie(res, refresh_token);
      this.logger.debug(`[CONTROLLER] refresh SUCCESS`, refId);
      return { access_token };
    } catch (error) {
      clearRefreshCookie(res);
      this.logger.error(`[CONTROLLER] refresh failed: ${error}`, refId);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Выход — удаляет refresh_token' })
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] logout`, refId);
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (token) {
      await this.authService.logout(token, refId);
    }
    clearRefreshCookie(res);
    return { message: 'Вы вышли из системы' };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Переключить роль (соискатель ↔ работодатель)' })
  @Patch('switch-role')
  async switchRole(
    @Body() dto: SwitchRoleDto,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: { id: number },
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] switch-role`, refId);
    try {
      const {
        access_token,
        refresh_token,
        user: updatedUser,
      } = await this.authService.switchRole(user.id, dto, refId);
      setRefreshCookie(res, refresh_token);
      this.logger.debug(`[CONTROLLER] switch-role SUCCESS`, refId);
      return { access_token, user: updatedUser };
    } catch (error) {
      this.logger.error(`[CONTROLLER] switch-role failed: ${error}`, refId);
      throw error;
    }
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Профиль текущего пользователя' })
  @Get('profile')
  async getProfile(
    @CurrentUser() user: { id: number },
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] get profile`, refId);
    try {
      const result = await this.authService.getProfile(user.id, refId);
      return result;
    } catch (error) {
      this.logger.error(`[CONTROLLER] get profile failed: ${error}`, refId);
      throw error;
    }
  }
}
