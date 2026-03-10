import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VacancyEntity } from '../database/entitis/vacancy.enity';
import { Repository } from 'typeorm';
import { CreateVacancyDto } from './dto/vacancy.dto';
import { CustomLogger } from '../../helpers/logger/logger.service';

@Injectable()
export class VacancyService {
  constructor(
    @InjectRepository(VacancyEntity)
    private readonly vacancyRepository: Repository<VacancyEntity>,
    private readonly logger: CustomLogger,
  ) {}

  async createVacancy(vacancyData: CreateVacancyDto, refId: string) {
    this.logger.debug(
      `[SERVICE] create vacancy ${JSON.stringify(vacancyData)}`,
      refId,
    );

    try {
      const vacancy = await this.vacancyRepository.create(vacancyData);
      return await this.vacancyRepository.save(vacancy);
    } catch (error) {
      this.logger.error(`[ERROR] create vacancy in Service`, refId);
      throw error;
    }
  }

  async getAllVacancy(refId: string) {
    this.logger.debug(`[SERVICE] get all vacancy`, refId);
    try {
      const vacancy = await this.vacancyRepository.find();
      return vacancy;
    } catch (error) {
      this.logger.error(`[ERROR] create vacancy in Service`, refId);
      throw error;
    }
  }
  async getByIdVacancy(id: number, refId: string) {
    this.logger.debug(`[SERVICE] get vacancy by id ${id}`, refId);

    try {
      const vacancy = await this.vacancyRepository.findOne({ where: { id } });

      return vacancy;
    } catch (error) {
      this.logger.error(
        `[ERROR] get vacancy by id ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async removeVacancy(id: number, refId: string) {
    this.logger.debug(`[SERVICE] remove by id vacancy`, refId);
    const vacancy = await this.getByIdVacancy(id, refId);

    if (!vacancy) {
      return 0;
    }

    try {
      const removeVacancy = await this.vacancyRepository.remove(vacancy);
      this.logger.debug(`[SERVICE]  remove by id vacancy SUCCESS`, refId);
      return removeVacancy;
    } catch (error) {
      this.logger.error(`[ERROR]  remove by id vacancy`, refId);
      throw error;
    }
  }

  async updateVacancy(
    id: number,
    vacancyData: CreateVacancyDto,
    refId: string,
  ) {
    this.logger.debug(`[SERVICE]  update by id vacancy SUCCESS`, refId);
    const vacancy = await this.getByIdVacancy(id, refId);

    if (!vacancy) {
      return 0;
    }

    try {
      await this.vacancyRepository.update(id, vacancyData);
      const updatedVacancy = await this.getByIdVacancy(id, refId);

      this.logger.debug(`[SERVICE] update by id vacancy SUCCESS`, refId);
      return updatedVacancy;
    } catch (error) {
      this.logger.error(`[ERROR]  update by id vacancy`, refId);
      throw error;
    }
  }
}
