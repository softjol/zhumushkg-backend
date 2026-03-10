import { Module } from '@nestjs/common';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserEntity } from '../database/entitis/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from '../database/entitis/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoleEntity])],
  controllers: [UserController],
  providers: [UserService, CustomLogger],
  exports: [UserService],
})
export class UserModule {}
