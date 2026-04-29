import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResumeService } from './resume.service';
import { ResumeResponseService } from './resume-response/resume-response.service';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { CreateResumeDto } from './dto/resume.dto';
import { ListResumeQueryDto } from './dto/list-resume-query.dto';
import { RefId } from '../../decorators/ref.decorator';
import {
  CreateResumeResponseDto,
  UpdateResumeResponseStatusDto,
} from './dto/resume-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Resume')
@Controller('resume')
export class ResumeController {
  constructor(
    private readonly resumeService: ResumeService,
    private readonly resumeResponseService: ResumeResponseService,
    private readonly logger: CustomLogger,
  ) {}

  // ─── RESUME CRUD ───────────────────────────────────

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Создать резюме (JWT после login)' })
  @Post()
  async createResume(
    @Body() resumeData: CreateResumeDto,
    @RefId() refId: string,
    @Req() req: Request & { user?: { id?: number } },
  ) {
    this.logger.debug(`[CONTROLLER] create resume`, refId);
    try {
      const userId = Number(req.user?.id);
      resumeData.user_id = userId;
      const resume = await this.resumeService.createResume(resumeData, refId);
      this.logger.debug(`[CONTROLLER] create resume SUCCESS`, refId);
      return resume;
    } catch (error) {
      this.logger.error(`[CONTROLLER] error creating resume: ${error}`, refId);
      throw error;
    }
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Мои резюме (JWT)' })
  @Get('my')
  async myResumes(
    @RefId() refId: string,
    @Req() req: Request & { user?: { id?: number } },
  ) {
    const userId = Number(req.user?.id);
    return await this.resumeService.getMyResumes(userId, refId);
  }

  @Get()
  async getAllResume(
    @RefId() refId: string,
    @Query() query: ListResumeQueryDto,
  ) {
    this.logger.debug(`[CONTROLLER] get all resume`, refId);
    try {
      return await this.resumeService.getAllResume(refId, query);
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error getting all resume: ${error}`,
        refId,
      );
      throw error;
    }
  }

  @Get(':id')
  async getResumeById(
    @Param('id', ParseIntPipe) id: number,
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] get resume by id ${id}`, refId);
    try {
      return await this.resumeService.getResumeById(id, refId);
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error getting resume by id ${id}: ${error}`,
        refId,
      );
      throw error;
    }
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Удалить резюме (JWT; свои отклики и связи удаляются вместе)',
  })
  @Delete(':id')
  async removeResume(
    @Param('id', ParseIntPipe) id: number,
    @RefId() refId: string,
    @Req() req: Request & { user?: { id?: number } },
  ) {
    this.logger.debug(`[CONTROLLER] remove resume by id ${id}`, refId);
    try {
      const userId = Number(req.user?.id);
      const resume = await this.resumeService.removeResume(id, userId, refId);
      this.logger.debug(`[CONTROLLER] remove resume SUCCESS id ${id}`, refId);
      return resume;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error remove resume ${id}: ${error}`,
        refId,
      );
      throw error;
    }
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Статус отклика на резюме (JWT; только владелец резюме). Тело: { "status": "accepted" | "rejected" }',
  })
  @Patch('response/:id/status')
  async updateResumeResponseStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateResumeResponseStatusDto,
    @RefId() refId: string,
    @Req() req: Request & { user?: { id?: number } },
  ) {
    this.logger.debug(
      `[CONTROLLER] update resume response status id: ${id} status: ${dto.status}`,
      refId,
    );
    try {
      const actingUserId = Number(req.user?.id);
      const response = await this.resumeResponseService.updateStatus(
        id,
        dto.status,
        actingUserId,
        refId,
      );
      this.logger.debug(`[CONTROLLER] update status SUCCESS id: ${id}`, refId);
      return response;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error update status response ${id}: ${error}`,
        refId,
      );
      throw error;
    }
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateResume(
    @Param('id', ParseIntPipe) id: number,
    @Body() resumeData: CreateResumeDto,
    @RefId() refId: string,
    @Req() req: Request & { user?: { id?: number } },
  ) {
    this.logger.debug(`[CONTROLLER] update resume ${id}`, refId);
    try {
      const actingUserId = Number(req.user?.id);
      const resume = await this.resumeService.updateResume(
        id,
        resumeData,
        actingUserId,
        refId,
      );
      this.logger.debug(`[CONTROLLER] update resume SUCCESS id ${id}`, refId);
      return resume;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error update resume ${id}: ${error}`,
        refId,
      );
      throw error;
    }
  }

  // RESUME RESPONSE

  // @ApiBearerAuth('access-token')
  // @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: 'Отклик на резюме (JWT после login)' })
  // @Post(':id/response')
  // async createResponse(
  //   @Param('id', ParseIntPipe) resumeId: number,
  //   @Body() dto: CreateResumeResponseDto,
  //   @RefId() refId: string,
  // ) {
  //   this.logger.debug(
  //     `[CONTROLLER] create response resumeId: ${resumeId} employerId: ${dto.employerId}`,
  //     refId,
  //   );
  //   try {
  //     const response = await this.resumeResponseService.createResponse(
  //       dto.employerId,
  //       resumeId,
  //       refId,
  //     );
  //     this.logger.debug(`[CONTROLLER] create response SUCCESS`, refId);
  //     return response;
  //   } catch (error) {
  //     this.logger.error(`[CONTROLLER] error create response: ${error}`, refId);
  //     throw error;
  //   }
  // }

  // @Get('responses/:id')
  // async getResponsesByResume(
  //   @Param('id', ParseIntPipe) resumeId: number,
  //   @RefId() refId: string,
  // ) {
  //   this.logger.debug(
  //     `[CONTROLLER] get responses by resumeId: ${resumeId}`,
  //     refId,
  //   );
  //   try {
  //     const responses = await this.resumeResponseService.getResponsesByResume(
  //       resumeId,
  //       refId,
  //     );
  //     this.logger.debug(
  //       `[CONTROLLER] get responses by resumeId SUCCESS`,
  //       refId,
  //     );
  //     return responses;
  //   } catch (error) {
  //     this.logger.error(
  //       `[CONTROLLER] error get responses by resume: ${error}`,
  //       refId,
  //     );
  //     throw error;
  //   }
  // }

  // @Get('employer/:id/responses')
  // async getResponsesByEmployer(
  //   @Param('id', ParseIntPipe) employerId: number,
  //   @RefId() refId: string,
  // ) {
  //   this.logger.debug(
  //     `[CONTROLLER] get responses by employerId: ${employerId}`,
  //     refId,
  //   );
  //   try {
  //     const responses = await this.resumeResponseService.getResponsesByEmployer(
  //       employerId,
  //       refId,
  //     );
  //     this.logger.debug(
  //       `[CONTROLLER] get responses by employerId SUCCESS`,
  //       refId,
  //     );
  //     return responses;
  //   } catch (error) {
  //     this.logger.error(
  //       `[CONTROLLER] error get responses by employer: ${error}`,
  //       refId,
  //     );
  //     throw error;
  //   }
  // }

  // @Patch('response/:id/status')
  // async updateStatus(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() dto: UpdateResumeResponseStatusDto,
  //   @RefId() refId: string,
  // ) {
  //   this.logger.debug(
  //     `[CONTROLLER] update status response id: ${id} status: ${dto.status}`,
  //     refId,
  //   );
  //   try {
  //     const response = await this.resumeResponseService.updateStatus(
  //       id,
  //       dto.status,
  //       refId,
  //     );
  //     this.logger.debug(`[CONTROLLER] update status SUCCESS id: ${id}`, refId);
  //     return response;
  //   } catch (error) {
  //     this.logger.error(
  //       `[CONTROLLER] error update status response ${id}: ${error}`,
  //       refId,
  //     );
  //     throw error;
  //   }
  // }

  // @Delete('response/:id')
  // async removeResponse(
  //   @Param('id', ParseIntPipe) id: number,
  //   @RefId() refId: string,
  // ) {
  //   this.logger.debug(`[CONTROLLER] remove response id: ${id}`, refId);
  //   try {
  //     const response = await this.resumeResponseService.removeResponse(
  //       id,
  //       refId,
  //     );
  //     this.logger.debug(
  //       `[CONTROLLER] remove response SUCCESS id: ${id}`,
  //       refId,
  //     );
  //     return response;
  //   } catch (error) {
  //     this.logger.error(
  //       `[CONTROLLER] error remove response ${id}: ${error}`,
  //       refId,
  //     );
  //     throw error;
  //   }
  // }
}
