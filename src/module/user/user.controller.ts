import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import { RefId } from 'src/decorators/ref.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { AppUserRole } from '../../common/constants/app-user-role';
import { BanUserDto } from './dto/ban-user.dto';

@ApiTags('User/Admin')
@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private logger: CustomLogger,
  ) {}

  private assertAdmin(req: Request & { user?: { role?: string } }) {
    const role = req.user?.role;
    this.logger.debug(
      `[CONTROLLER] Checking admin role, user role: ${role}`,
      'assertAdmin',
    );
    if (role !== 'ADMIN') {
      throw new ForbiddenException(
        'Только администратор может выполнять это действие',
      );
    }
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'ADMIN: все соискатели с их резюме' })
  @Get('admin/job-seekers-with-resumes')
  async getAllSeekersWithResumes(
    @RefId() refId: string,
    @Req() req: Request & { user?: { role?: string } },
  ) {
    this.assertAdmin(req);
    this.logger.debug(`[CONTROLLER] get all job seekers with resumes`, refId);
    return await this.userService.getUsersByRoleWithRelations(
      AppUserRole.JOB_SEEKER,
      refId,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'ADMIN: все работодатели с их вакансиями' })
  @Get('admin/employers-with-vacancies')
  async getAllEmployersWithVacancies(
    @RefId() refId: string,
    @Req() req: Request & { user?: { role?: string } },
  ) {
    this.assertAdmin(req);
    return await this.userService.getUsersByRoleWithRelations(
      AppUserRole.EMPLOYER,
      refId,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'ADMIN: бан/разбан пользователя' })
  @Patch('admin/:id/ban')
  async banUser(
    @Param('id') id: number,
    @RefId() refId: string,
    @Req() req: Request & { user?: { role?: string } },
  ) {
    this.assertAdmin(req);
    return await this.userService.setBanStatus(id, refId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'ADMIN: удалить пользователя' })
  @Delete(':id')
  async removeById(
    @Param('id') id: number,
    @RefId() refId: string,
    @Req() req: Request & { user?: { role?: string } },
  ) {
    this.assertAdmin(req);
    this.logger.debug(`[CONTROLLER] remove user by id ${id}`, refId);

    try {
      const user = await this.userService.findOneById(id, refId);

      if (!user) {
        this.logger.debug(`[CONTROLLER] User with id ${id} not found`, refId);
        return { message: `User with id ${id} not found` };
      }

      await this.userService.removeById(id, refId);
      this.logger.debug(
        `[CONTROLLER] User with id ${id} removed successfully`,
        refId,
      );
      return { message: `Пользователь с id ${id} удален успешно` };
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] Error occurred while removing user by id ${id}`,
        refId,
      );
      throw error;
    }
  }
}
