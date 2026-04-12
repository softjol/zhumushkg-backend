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
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { RefId } from 'src/decorators/ref.decorator';
import { ApplicationStatus } from '../database/entitis/application.entity';
import { CreateApplicationDto } from './dto/application.dto';
import { CustomLogger } from 'src/helpers/logger/logger.service';

@Controller('applications')
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly logger: CustomLogger,
  ) {}

  @Post()
  async create(@Body() dto: CreateApplicationDto, @RefId() refId: string) {
    this.logger.debug(`[CONTROLLER] Create application`, refId);
    return await this.applicationService.create(dto, refId);
  }

  @Get()
  async findAll(@RefId() refId: string) {
    return await this.applicationService.findAll(refId);
  }

  @Get(':id')
  async findById(@Param('id') id: number, @RefId() refId: string) {
    return await this.applicationService.findById(id, refId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ApplicationStatus,
    @Body('hrId') hrId: number,
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] Update status for application ${id}`,
      refId,
    );
    return await this.applicationService.updateStatus(id, status, hrId, refId);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @RefId() refId: string) {
    this.logger.debug(`[CONTROLLER] Withdraw application ${id}`, refId);
    await this.applicationService.remove(id, refId);
    return { message: 'Application successfully withdrawn' };
  }
}
