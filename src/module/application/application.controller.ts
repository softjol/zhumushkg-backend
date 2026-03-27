import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { RefId } from '../../decorators/ref.decorator';
import {
  CreateApplicationDto,
  UpdateApplicationStatusDto,
} from './dto/application.dto';

@Controller('application')
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly logger: CustomLogger,
  ) {}

  // Соискатель откликается на вакансию
  @Post()
  async createApplication(
    @Body() dto: CreateApplicationDto,
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] create application applicantId: ${dto.applicantId} vacancyId: ${dto.vacancyId}`,
      refId,
    );
    try {
      const application = await this.applicationService.createApplication(
        dto.applicantId,
        dto.vacancyId,
        refId,
      );
      this.logger.debug(`[CONTROLLER] create application SUCCESS`, refId);
      return application;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error create application: ${error}`,
        refId,
      );
      throw error;
    }
  }

  // Работодатель видит все отклики на вакансию
  @Get('vacancy/:id')
  async getApplicationsByVacancy(
    @Param('id', ParseIntPipe) vacancyId: number,
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] get applications by vacancyId: ${vacancyId}`,
      refId,
    );
    try {
      const applications =
        await this.applicationService.getApplicationsByApplicant(
          vacancyId,
          refId,
        );
      this.logger.debug(
        `[CONTROLLER] get applications by vacancyId SUCCESS`,
        refId,
      );
      return applications;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error get applications by vacancy: ${error}`,
        refId,
      );
      throw error;
    }
  }

  // Соискатель видит свои отклики
  @Get('my/:id')
  async getApplicationsByApplicant(
    @Param('id', ParseIntPipe) applicantId: number,
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] get applications by applicantId: ${applicantId}`,
      refId,
    );
    try {
      const applications =
        await this.applicationService.getApplicationsByApplicant(
          applicantId,
          refId,
        );
      this.logger.debug(
        `[CONTROLLER] get applications by applicantId SUCCESS`,
        refId,
      );
      return applications;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error get applications by applicant: ${error}`,
        refId,
      );
      throw error;
    }
  }

  // Работодатель меняет статус отклика
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApplicationStatusDto,
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] update status application id: ${id} status: ${dto.status}`,
      refId,
    );
    try {
      const application = await this.applicationService.updateStatus(
        id,
        dto.status,
        refId,
      );
      this.logger.debug(`[CONTROLLER] update status SUCCESS id: ${id}`, refId);
      return application;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error update status application ${id}: ${error}`,
        refId,
      );
      throw error;
    }
  }

  // Удалить отклик
  @Delete(':id')
  async removeApplication(
    @Param('id', ParseIntPipe) id: number,
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] remove application id: ${id}`, refId);
    try {
      const application = await this.applicationService.removeApplication(
        id,
        refId,
      );
      this.logger.debug(
        `[CONTROLLER] remove application SUCCESS id: ${id}`,
        refId,
      );
      return application;
    } catch (error) {
      this.logger.error(
        `[CONTROLLER] error remove application ${id}: ${error}`,
        refId,
      );
      throw error;
    }
  }
}
