import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VacancyEntity } from '../database/entitis/vacancy.entity';
import { Repository } from 'typeorm';
import { CreateVacancyDto } from './dto/vacancy.dto';
import { ListVacancyQueryDto } from './dto/list-vacancy-query.dto';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { ApplicationEntity } from '../database/entitis/application.entity';

@Injectable()
export class VacancyService {
  constructor(
    @InjectRepository(VacancyEntity)
    private readonly vacancyRepository: Repository<VacancyEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
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

  async getAllVacancy(refId: string, query: ListVacancyQueryDto) {
    this.logger.debug(`[SERVICE] get all vacancy`, refId);
    try {
      const qb = this.vacancyRepository.createQueryBuilder('v');
      if (query.category?.trim()) {
        qb.andWhere('v.category = :category', {
          category: query.category.trim(),
        });
      }
      if (query.city?.trim()) {
        qb.andWhere('v.city ILIKE :city', {
          city: `%${query.city.trim()}%`,
        });
      }
      if (query.region?.trim()) {
        qb.andWhere('v.region ILIKE :region', {
          region: `%${query.region.trim()}%`,
        });
      }
      if (query.position?.trim()) {
        qb.andWhere('v.position ILIKE :position', {
          position: `%${query.position.trim()}%`,
        });
      }
      if (query.experience_work?.trim()) {
        qb.andWhere('v.experience_work ILIKE :experience_work', {
          experience_work: `%${query.experience_work.trim()}%`,
        });
      }
      if (query.payment_period?.trim()) {
        qb.andWhere('v.payment_period = :payment_period', {
          payment_period: query.payment_period.trim(),
        });
      }
      if (
        typeof query.salary_from === 'number' &&
        !Number.isNaN(query.salary_from)
      ) {
        qb.andWhere('v.salary_net >= :salary_from', {
          salary_from: query.salary_from,
        });
      }
      if (
        typeof query.salary_to === 'number' &&
        !Number.isNaN(query.salary_to)
      ) {
        qb.andWhere('v.salary_net <= :salary_to', {
          salary_to: query.salary_to,
        });
      }
      if (typeof query.remote_work === 'boolean') {
        qb.andWhere('v.remote_work = :remote_work', {
          remote_work: query.remote_work,
        });
      }
      if (query.work_schedule?.trim()) {
        qb.andWhere('v.work_schedule = :work_schedule', {
          work_schedule: query.work_schedule.trim(),
        });
      }
      if (query.search?.trim()) {
        const s = `%${query.search.trim()}%`;
        qb.andWhere(
          '(v.position ILIKE :s OR v.description ILIKE :s OR v.company ILIKE :s OR v.requirements ILIKE :s OR v.conditions ILIKE :s)',
          { s },
        );
      }
      qb.orderBy('v.createdAt', 'DESC');
      return await qb.getMany();
    } catch (error) {
      this.logger.error(`[ERROR] create vacancy in Service`, refId);
      throw error;
    }
  }

  async getMyVacancies(userId: number, refId: string) {
    this.logger.debug(`[SERVICE] get my vacancies userId=${userId}`, refId);
    try {
      return await this.vacancyRepository.find({
        where: { user_id: userId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `[ERROR] get my vacancies userId=${userId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }
  private async findVacancyById(id: number, refId: string) {
    this.logger.debug(`[SERVICE] find vacancy by id ${id}`, refId);
    try {
      return await this.vacancyRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error(
        `[ERROR] get vacancy by id ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  /** Публичный просмотр карточки: увеличивает счётчик views. */
  async getByIdVacancy(id: number, refId: string) {
    this.logger.debug(`[SERVICE] get vacancy by id (public) ${id}`, refId);
    try {
      const vacancy = await this.findVacancyById(id, refId);
      if (vacancy) {
        await this.vacancyRepository.increment({ id: vacancy.id }, 'views', 1);
        vacancy.views = (vacancy.views ?? 0) + 1;
      }
      return vacancy;
    } catch (error) {
      this.logger.error(
        `[ERROR] get vacancy by id ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  /**
   * legacy signature: в прод-режиме удаление должно быть привязано к ownerId.
   * Используйте `removeVacancy(id, ownerId, refId)`.
   */
  async removeVacancyLegacy(id: number, refId: string) {
    throw new ForbiddenException(
      'Не удалось выполнить удаление: передайте ownerId',
    );
  }

  private async getOwnedVacancyById(
    id: number,
    ownerId: number,
    refId: string,
  ) {
    const vacancy = await this.findVacancyById(id, refId);
    if (!vacancy) {
      throw new NotFoundException(`Vacancy #${id} not found`);
    }
    if (vacancy.user_id !== ownerId) {
      throw new ForbiddenException(
        'Можно удалять/редактировать только свои вакансии',
      );
    }
    return vacancy;
  }

  async removeVacancy(id: number, ownerId: number, refId: string) {
    this.logger.debug(`[SERVICE] remove by id vacancy`, refId);
    const vacancy = await this.getOwnedVacancyById(id, ownerId, refId);

    try {
      return await this.vacancyRepository.remove(vacancy);
    } catch (error) {
      this.logger.error(`[ERROR]  remove by id vacancy`, refId);
      throw error;
    }
  }

  async updateVacancy(
    id: number,
    vacancyData: CreateVacancyDto,
    ownerId: number,
    refId: string,
  ) {
    this.logger.debug(`[SERVICE]  update by id vacancy SUCCESS`, refId);
    await this.getOwnedVacancyById(id, ownerId, refId);

    try {
      await this.vacancyRepository.update(id, vacancyData);
      const updatedVacancy = await this.findVacancyById(id, refId);
      return updatedVacancy;
    } catch (error) {
      this.logger.error(`[ERROR]  update by id vacancy`, refId);
      throw error;
    }
  }

  async getVacancyCandidates(
    vacancyId: number,
    ownerId: number,
    refId: string,
  ) {
    const vacancy = await this.findVacancyById(vacancyId, refId);
    if (!vacancy) {
      throw new NotFoundException(`Vacancy #${vacancyId} not found`);
    }
    if (vacancy.user_id !== ownerId) {
      throw new ForbiddenException(
        'Можно смотреть кандидатов только по своим вакансиям',
      );
    }
    return await this.applicationRepository.find({
      where: { vacancy_id: vacancyId },
      relations: ['candidate', 'resume'],
      order: { created_at: 'DESC' },
    });
  }
}
