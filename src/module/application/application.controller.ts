import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApplicationService } from './application.service';
import { RefId } from 'src/decorators/ref.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ApplicationStatus } from '../database/entitis/application.entity';
import { CreateApplicationDto } from './dto/application.dto';
import { CustomLogger } from 'src/helpers/logger/logger.service';

@ApiTags('Вакансии и резюме')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly logger: CustomLogger,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Подать отклик на вакансию' })
  async create(
    @Body() dto: CreateApplicationDto,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] Create application userId=${user.id}`,
      refId,
    );
    return await this.applicationService.create(dto, user.id, refId);
  }

  @Get()
  async findAll(
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] Get all applications userId=${user.id}`,
      refId,
    );
    return await this.applicationService.findAll(user.id, refId);
  }

  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] Get application id=${id}, userId=${user.id}`,
      refId,
    );
    return await this.applicationService.findById(id, user.id, refId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ApplicationStatus,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] Update status id=${id}, userId=${user.id}`,
      refId,
    );
    return await this.applicationService.updateStatus(
      id,
      status,
      user.id,
      refId,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] Withdraw application id=${id}, userId=${user.id}`,
      refId,
    );
    await this.applicationService.remove(id, user.id, refId);
    return { message: 'Application successfully withdrawn' };
  }
}
