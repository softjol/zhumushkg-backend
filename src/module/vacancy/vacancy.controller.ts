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
import { VacancyService } from './vacancy.service';
import { CreateVacancyDto } from './dto/vacancy.dto';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { RefId } from '../../decorators/ref.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Вакансии')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('vacancy')
export class VacancyController {
  constructor(
    private readonly vacancyService: VacancyService,
    private readonly logger: CustomLogger,
  ) {}

  @Post()
  async createVacancy(
    @Body() vacancyData: CreateVacancyDto,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] create vacancy userId=${user.id}`, refId);
    try {
      const vacancy = await this.vacancyService.createVacancy(
        vacancyData,
        refId,
      );
      this.logger.debug(
        `[CONTROLLER] create vacancy SUCCESS userId=${user.id}`,
        refId,
      );
      return vacancy;
    } catch (error) {
      this.logger.error(
        `[ERROR] create vacancy userId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Get()
  async getAllVacancy(
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] get all vacancy userId=${user.id}`, refId);
    try {
      const vacancy = await this.vacancyService.getAllVacancy(refId);
      this.logger.debug(
        `[CONTROLLER] get all vacancy SUCCESS userId=${user.id}`,
        refId,
      );
      return vacancy;
    } catch (error) {
      this.logger.error(
        `[ERROR] get all vacancy userId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Get(':id')
  async getByIdVacancy(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] get by id vacancy id=${id}, userId=${user.id}`,
      refId,
    );
    try {
      const vacancy = await this.vacancyService.getByIdVacancy(id, refId);
      this.logger.debug(
        `[CONTROLLER] get by id vacancy SUCCESS id=${id}, userId=${user.id}`,
        refId,
      );
      return vacancy;
    } catch (error) {
      this.logger.error(
        `[ERROR] get by id vacancy id=${id}, userId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Delete(':id')
  async removeByIdVacancy(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] remove by id vacancy id=${id}, userId=${user.id}`,
      refId,
    );
    try {
      const vacancy = await this.vacancyService.removeVacancy(id, refId);
      this.logger.debug(
        `[CONTROLLER] remove by id vacancy SUCCESS id=${id}, userId=${user.id}`,
        refId,
      );
      return vacancy;
    } catch (error) {
      this.logger.error(
        `[ERROR] remove by id vacancy id=${id}, userId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Patch(':id')
  async updateVacancy(
    @Param('id', ParseIntPipe) id: number,
    @Body() vacancyData: CreateVacancyDto,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] update vacancy id=${id}, userId=${user.id}`,
      refId,
    );
    try {
      const vacancy = await this.vacancyService.updateVacancy(
        id,
        vacancyData,
        refId,
      );
      this.logger.debug(
        `[CONTROLLER] update vacancy SUCCESS id=${id}, userId=${user.id}`,
        refId,
      );
      return vacancy;
    } catch (error) {
      this.logger.error(
        `[ERROR] update vacancy id=${id}, userId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }
}
