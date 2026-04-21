import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from '../database/entitis/role.entity';
import { Repository } from 'typeorm';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import { RoleDto } from './dto/role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly logger: CustomLogger,
  ) {}

  async createRole(roleData: RoleDto, refId: string) {
    this.logger.debug(
      `[SERVICE] create role ${JSON.stringify(roleData)}`,
      refId,
    );
    try {
      this.logger.debug(
        `[SERVICE] create role SUCCESS ${JSON.stringify(roleData)}`,
        refId,
      );

      const roles = this.roleRepository.create({
        role: roleData.role,
        description: roleData.description,
      });

      return await this.roleRepository.save(roles);
    } catch (error) {}
  }
}
