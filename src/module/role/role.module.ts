import { Module } from '@nestjs/common';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from '../database/entitis/role.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity]), AuthModule],
  controllers: [RoleController],
  providers: [RoleService, CustomLogger],
  exports: [RoleService],
})
export class RoleModule {}
