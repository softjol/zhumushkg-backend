import { Module } from '@nestjs/common';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    UserModule,
    TelegramModule,
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      secret: 'SECRET_KEY',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CustomLogger],
  exports: [AuthService],
})
export class AuthModule {}
