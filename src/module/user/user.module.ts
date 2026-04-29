import { Module } from '@nestjs/common';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserEntity } from '../database/entitis/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from '../database/entitis/role.entity';
import { TelegramModule } from '../telegram/telegram.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RoleEntity]),
    TelegramModule,
    JwtModule,
  ],
  controllers: [UserController],
  providers: [UserService, CustomLogger],
  exports: [UserService],
})
export class UserModule {}
