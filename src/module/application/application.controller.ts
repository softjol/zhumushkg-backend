import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApplicationService } from './application.service';
import { RefId } from 'src/decorators/ref.decorator';
import { CreateApplicationDto } from './dto/application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Отклики на вакансии')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly logger: CustomLogger,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Подать отклик на вакансию (JWT после login)',
    description:
      'После успешного отклика автоматически создаётся диалог (поле `chat` в ответе). ID чата = `conversationId` в REST/WebSocket.',
  })
  @Post()
  async create(
    @Body() dto: CreateApplicationDto,
    @RefId() refId: string,
    @Req() req: Request & { user?: { id?: number } },
  ) {
    this.logger.debug(`[CONTROLLER] Create application`, refId);
    const candidateId = Number(req.user?.id);
    return await this.applicationService.create(dto, candidateId, refId);
  }

  @Get()
  async findAll(
    @RefId() refId: string,
    @Req() req: Request & { user?: { id?: number; role?: string } },
  ) {
    const actingRole = req.user?.role;
    return await this.applicationService.findAll(actingRole, refId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Мои отклики (текущий пользователь, JWT)' })
  @Get('my')
  async findMy(
    @RefId() refId: string,
    @Req() req: Request & { user?: { id?: number } },
  ) {
    const candidateId = Number(req.user?.id);
    return await this.applicationService.findMy(candidateId, refId);
  }

  @Get(':id')
  async findById(
    @Param('id') id: number,
    @RefId() refId: string,
    @Req() req: Request & { user?: { id?: number; role?: string } },
  ) {
    const actingRole = req.user?.role;
    const actingUserId = Number(req.user?.id);
    return await this.applicationService.findById(
      id,
      actingUserId,
      actingRole,
      refId,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Сменить статус отклика (JWT; только владелец вакансии). Тело: { "status": "REVIEWING" }',
  })
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApplicationStatusDto,
    @RefId() refId: string,
    @Req() req: Request & { user?: { id?: number } },
  ) {
    this.logger.debug(
      `[CONTROLLER] Update status for application ${id}`,
      refId,
    );
    const employerUserId = Number(req.user?.id);
    return await this.applicationService.updateStatus(
      id,
      dto.status,
      employerUserId,
      refId,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @RefId() refId: string,
    @Req() req: Request & { user?: { id?: number; role?: string } },
  ) {
    const actingRole = req.user?.role;
    const actingUserId = Number(req.user?.id);
    this.logger.debug(`[CONTROLLER] Withdraw application ${id}`, refId);
    await this.applicationService.remove(id, actingUserId, actingRole, refId);
    return { message: 'Application successfully withdrawn' };
  }
}
