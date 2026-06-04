import { Module } from '@nestjs/common';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserEntity } from '../database/entitis/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from '../database/entitis/role.entity';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RoleEntity]),
    WhatsappModule,
    JwtModule,
  ],
  controllers: [UserController],
  providers: [UserService, CustomLogger],
  exports: [UserService],
})
export class UserModule {}
