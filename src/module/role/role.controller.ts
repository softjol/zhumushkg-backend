import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import { RoleDto } from './dto/role.dto';
import { RefId } from 'src/decorators/ref.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Role')
@Controller('role')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly logger: CustomLogger,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Создать роль (JWT после login)' })
  @Post()
  async createRole(@Body() roleData: RoleDto, @RefId() refId: string) {
    this.logger.debug(
      `[CONTROLLER] create role: ${JSON.stringify(roleData)}`,
      refId,
    );
    try {
      this.logger.debug(
        `[CONTROLLER] create role SUCCESS: ${JSON.stringify(roleData)}`,
        refId,
      );
      const role = await this.roleService.createRole(roleData, refId);

      return role;
    } catch (error) {
      this.logger.error(`[ERROR] create role: ${JSON.stringify(error)}`, refId);
      throw error;
    }
  }
}
