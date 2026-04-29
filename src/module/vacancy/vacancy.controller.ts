import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VacancyService } from './vacancy.service';
import { CreateVacancyDto } from './dto/vacancy.dto';
import { ListVacancyQueryDto } from './dto/list-vacancy-query.dto';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { RefId } from '../../decorators/ref.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Вакансии')
@Controller('vacancy')
export class VacancyController {
  constructor(
    private readonly vacancyService: VacancyService,
    private readonly logger: CustomLogger,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Создать вакансию (JWT после login)' })
  @Post()
  async createVacancy(
    @Body() vacancyData: CreateVacancyDto,
    @RefId() refId: string,
    @Req() req: Request & { user?: { id?: number } },
  ) {
    this.logger.debug(
      `[CONTROLLER] create vacancy ${JSON.stringify(vacancyData)}`,
      refId,
    );

    try {
      const userId = Number(req.user?.id);
      vacancyData.user_id = userId;
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

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Мои вакансии (JWT)' })
  @Get('my')
  async myVacancies(
    @RefId() refId: string,
    @Req() req: Request & { user?: { id?: number } },
  ) {
    const userId = Number(req.user?.id);
    return await this.vacancyService.getMyVacancies(userId, refId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Кандидаты по моей вакансии (JWT)' })
  @Get('my/:id/candidates')
  async getMyVacancyCandidates(
    @Param('id') id: number,
    @RefId() refId: string,
    @Req() req: Request & { user?: { id?: number } },
  ) {
    const userId = Number(req.user?.id);
    return await this.vacancyService.getVacancyCandidates(id, userId, refId);
  }

  @Get()
  async getAllVacancy(
    @RefId() refId: string,
    @Query() query: ListVacancyQueryDto,
  ) {
    this.logger.debug(`[CONTROLLER] get all vacancy`, refId);
    try {
      const vacancy = await this.vacancyService.getAllVacancy(refId, query);

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

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async removeByIdVacancy(
    @Param('id') id: number,
    @RefId() refId: string,
    @Req() req: Request & { user?: { id?: number } },
  ) {
    this.logger.debug(`[CONTROLLER] remove by id vacancy`, refId);
    try {
      const userId = Number(req.user?.id);
      const vacancy = await this.vacancyService.removeVacancy(
        id,
        userId,
        refId,
      );

      return vacancy;
    } catch (error) {
      this.logger.error(
        `[ERROR] remove by id vacancy ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateVacancy(
    @Param('id') id: number,
    @Body() vacancyData: CreateVacancyDto,
    @RefId() refId: string,
    @Req() req: Request & { user?: { id?: number } },
  ) {
    this.logger.debug(`[CONTROLLER]  update by id vacancy SUCCESS`, refId);

    try {
      const userId = Number(req.user?.id);
      const vacancy = await this.vacancyService.updateVacancy(
        id,
        vacancyData,
        userId,
        refId,
      );

      return vacancy;
    } catch (error) {
      this.logger.error(`[ERROR]  update by id vacancy`, refId);
      throw error;
    }
  }
}
