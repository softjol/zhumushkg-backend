import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VacancyService } from './vacancy.service';
import { CreateVacancyDto } from './dto/vacancy.dto';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { RefId } from '../../decorators/ref.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Вакансии и резюме')
@Controller('vacancy')
export class VacancyController {
  constructor(
    private readonly vacancyService: VacancyService,
    private readonly logger: CustomLogger,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Создать вакансию (только после входа)' })
  @Post()
  async createVacancy(
    @Body() vacancyData: CreateVacancyDto,
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] create vacancy ${JSON.stringify(vacancyData)}`,
      refId,
    );

    try {
      const vacancy = await this.vacancyService.createVacancy(
        vacancyData,
        refId,
      );

      return vacancy;
    } catch (error) {
      this.logger.error(
        `[ERROR] create vacancy ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Get()
  async getAllVacancy(@RefId() refId: string) {
    this.logger.debug(`[CONTROLLER] get all vacancy`, refId);
    try {
      const vacancy = await this.vacancyService.getAllVacancy(refId);

      return vacancy;
    } catch (error) {
      this.logger.error(
        `[ERROR] get all  vacancy ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Get(':id')
  async getByIdVacancy(@Param('id') id: number, @RefId() refId: string) {
    this.logger.debug(`[CONTROLLER] get by id vacancy`, refId);
    try {
      const vacancy = await this.vacancyService.getByIdVacancy(id, refId);

      return vacancy;
    } catch (error) {
      this.logger.error(
        `[ERROR] get by id vacancy ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Delete(':id')
  async removeByIdVacancy(@Param('id') id: number, @RefId() refId: string) {
    this.logger.debug(`[CONTROLLER] remove by id vacancy`, refId);
    try {
      const vacancy = await this.vacancyService.removeVacancy(id, refId);

      return vacancy;
    } catch (error) {
      this.logger.error(
        `[ERROR] remove by id vacancy ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Patch(':id')
  async updateVacancy(
    @Param('id') id: number,
    @Body() vacancyData: CreateVacancyDto,
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER]  update by id vacancy SUCCESS`, refId);

    try {
      const vacancy = await this.vacancyService.updateVacancy(
        id,
        vacancyData,
        refId,
      );

      return vacancy;
    } catch (error) {
      this.logger.error(`[ERROR]  update by id vacancy`, refId);
      throw error;
    }
  }
}
