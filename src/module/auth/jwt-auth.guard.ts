import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.headers?.authorization as string | undefined;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Вы не авторизованы');
    }
    const token = header.slice(7).trim();
    let payload: Record<string, any>;
    try {
      const jwtSecret = process.env.JWT_SECRET || 'SECRET_KEY';
      payload = this.jwtService.verify(token, { secret: jwtSecret });
    } catch (error: any) {
      throw new UnauthorizedException(
        `Неверный или истёкший токен: ${error?.message ?? 'verify failed'}`,
      );
    }

    if (payload?.isBanned === true) {
      throw new UnauthorizedException('Пользователь заблокирован');
    }

    req.user = payload;
    return true;
  }
}
