import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResumeService } from './resume.service';
import { ResumeResponseService } from './resume-response/resume-response.service';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { CreateResumeDto } from './dto/resume.dto';
import { RefId } from '../../decorators/ref.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { UpdateResumeResponseStatusDto } from './dto/resume-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Резюме')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('resume')
export class ResumeController {
  constructor(
    private readonly resumeService: ResumeService,
    private readonly resumeResponseService: ResumeResponseService,
    private readonly logger: CustomLogger,
  ) {}

  // ─── RESUME CRUD ───────────────────────────────────

  @Post()
  async createResume(
    @Body() resumeData: CreateResumeDto,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] create resume userId=${user.id}`, refId);
    try {
      const resume = await this.resumeService.createResume(resumeData, refId);
      this.logger.debug(
        `[CONTROLLER] create resume SUCCESS userId=${user.id}`,
        refId,
      );
      return resume;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error creating resume userId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Get()
  async getAllResume(
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] get all resume userId=${user.id}`, refId);
    try {
      return await this.resumeService.getAllResume(refId);
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error getting all resume userId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Get(':id')
  async getResumeById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] get resume by id=${id}, userId=${user.id}`,
      refId,
    );
    try {
      return await this.resumeService.getResumeById(id, refId);
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error getting resume id=${id}, userId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Delete(':id')
  async removeResume(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] remove resume id=${id}, userId=${user.id}`,
      refId,
    );
    try {
      const resume = await this.resumeService.removeResume(id, refId);
      this.logger.debug(
        `[CONTROLLER] remove resume SUCCESS id=${id}, userId=${user.id}`,
        refId,
      );
      return resume;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error remove resume id=${id}, userId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Patch(':id')
  async updateResume(
    @Param('id', ParseIntPipe) id: number,
    @Body() resumeData: CreateResumeDto,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] update resume id=${id}, userId=${user.id}`,
      refId,
    );
    try {
      const resume = await this.resumeService.updateResume(
        id,
        resumeData,
        refId,
      );
      this.logger.debug(
        `[CONTROLLER] update resume SUCCESS id=${id}, userId=${user.id}`,
        refId,
      );
      return resume;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error update resume id=${id}, userId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  // ─── RESUME RESPONSE ───────────────────────────────

  @Post(':id/response')
  async createResponse(
    @Param('id', ParseIntPipe) resumeId: number,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] create response resumeId=${resumeId}, employerId=${user.id}`,
      refId,
    );
    try {
      const response = await this.resumeResponseService.createResponse(
        user.id, // employerId из JWT
        resumeId,
        refId,
      );
      this.logger.debug(
        `[CONTROLLER] create response SUCCESS resumeId=${resumeId}, employerId=${user.id}`,
        refId,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error create response resumeId=${resumeId}, employerId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Get('responses/:id')
  async getResponsesByResume(
    @Param('id', ParseIntPipe) resumeId: number,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] get responses by resumeId=${resumeId}, userId=${user.id}`,
      refId,
    );
    try {
      const responses = await this.resumeResponseService.getResponsesByResume(
        resumeId,
        refId,
      );
      this.logger.debug(
        `[CONTROLLER] get responses by resumeId SUCCESS resumeId=${resumeId}`,
        refId,
      );
      return responses;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error get responses by resumeId=${resumeId}, userId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Get('employer/responses')
  async getResponsesByEmployer(
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] get responses by employerId=${user.id}`,
      refId,
    );
    try {
      const responses = await this.resumeResponseService.getResponsesByEmployer(
        user.id, // employerId из JWT
        refId,
      );
      this.logger.debug(
        `[CONTROLLER] get responses by employerId SUCCESS employerId=${user.id}`,
        refId,
      );
      return responses;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error get responses by employerId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Patch('response/:id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateResumeResponseStatusDto,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] update status response id=${id}, status=${dto.status}, userId=${user.id}`,
      refId,
    );
    try {
      const response = await this.resumeResponseService.updateStatus(
        id,
        dto.status,
        refId,
      );
      this.logger.debug(
        `[CONTROLLER] update status SUCCESS id=${id}, userId=${user.id}`,
        refId,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error update status id=${id}, userId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Delete('response/:id')
  async removeResponse(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] remove response id=${id}, userId=${user.id}`,
      refId,
    );
    try {
      const response = await this.resumeResponseService.removeResponse(
        id,
        refId,
      );
      this.logger.debug(
        `[CONTROLLER] remove response SUCCESS id=${id}, userId=${user.id}`,
        refId,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error remove response id=${id}, userId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }
}
