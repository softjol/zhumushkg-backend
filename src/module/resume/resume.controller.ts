import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ResumeService } from './resume.service';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import { CreateResumeDto } from './dto/resume.dto';
import { RefId } from 'src/decorators/ref.decorator';
import { ref } from 'process';

@Controller('resume')
export class ResumeController {
  constructor(
    private readonly resumeService: ResumeService,
    private readonly logger: CustomLogger,
  ) {}

  @Post()
  async createResume(
    @Body() resumeData: CreateResumeDto,
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] create resume`, refId);
    try {
      const resume = await this.resumeService.createResume(resumeData, refId);
      this.logger.debug(`[CONTROLLER] create resume SUCCESS`, refId);
      return resume;
    } catch (error) {
      this.logger.error(`[CONTROLLER] error creating resume: ${error}`, refId);
      throw error;
    }
  }

  @Get()
  async getAllResume(@RefId() refId: string) {
    this.logger.debug(`[CONTROLLER] get all resume`, refId);
    try {
      return await this.resumeService.getAllResume(refId);
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error getting all resume: ${error}`,
        refId,
      );
      throw error;
    }
  }

  @Get(`:id`)
  async getResumeById(@RefId() refId: string, @Param('id') id: number) {
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

  @Delete(`:id`)
  async removeResume(@RefId() refId: string, @Param('id') id: number) {
    this.logger.debug(`[CONTROLLER] remove resume by id ${id}`, refId);
    try {
      const resume = await this.resumeService.removeResume(id, refId);

      return resume;
    } catch (error) {
      this.logger.debug(
        `[ERROR] error remove resume ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Patch(':id')
  async updateResume(
    @Param('id') id: number,
    @Body() resumeData: CreateResumeDto,
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] update resume ${id}`, refId);
    try {
      const resume = await this.resumeService.updateResume(
        id,
        resumeData,
        refId,
      );

      this.logger.debug(`[CONTROLLER] update resume SUCCESS`, refId);
      return resume;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error update resume ${id}: ${error}`,
        refId,
      );
      throw error;
    }
  }
}
