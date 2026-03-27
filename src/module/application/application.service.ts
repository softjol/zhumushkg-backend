import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApplicationEntity,
  ApplicationStatus,
} from '../database/entitis/application.entity';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { NotificationService } from '../notification/notificant.service';
import { UserEntity } from '../database/entitis/user.entity';
import { VacancyEntity } from '../database/entitis/vacancy.enity';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(VacancyEntity)
    private readonly vacancyRepository: Repository<VacancyEntity>,
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
  ) {}

  async createApplication(
    applicantId: number,
    vacancyId: number,
    refId: string,
  ) {
    this.logger.debug(
      `[SERVICE] create application applicantId: ${applicantId} vacancyId: ${vacancyId}`,
      refId,
    );
    try {
      const existing = await this.applicationRepository.findOne({
        where: { applicantId, vacancyId },
      });

      if (existing) {
        throw new HttpException(
          'Вы уже откликались на эту вакансию',
          HttpStatus.BAD_REQUEST,
        );
      }

      const application = this.applicationRepository.create({
        applicantId,
        vacancyId,
        status: ApplicationStatus.PENDING,
      });

      const saved = await this.applicationRepository.save(application);

      // Находим вакансию и автора
      const vacancy = await this.vacancyRepository.findOne({
        where: { id: vacancyId },
      });
      const applicant = await this.userRepository.findOne({
        where: { id: applicantId },
      });

      if (vacancy && applicant) {
        const employer = await this.userRepository.findOne({
          where: { id: vacancy.user_id },
        });
        if (employer) {
          await this.notificationService.sendNotification(
            employer.id,
            'Новый отклик',
            `${applicant.fullName} откликнулся на вашу вакансию "${vacancy.position}"`,
            refId,
          );
        }
      }

      this.logger.debug(
        `[SERVICE] create application SUCCESS id: ${saved.id}`,
        refId,
      );
      return saved;
    } catch (error) {
      this.logger.error(
        `[ERROR] create application: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async updateStatus(id: number, status: ApplicationStatus, refId: string) {
    this.logger.debug(
      `[SERVICE] update status application id: ${id} status: ${status}`,
      refId,
    );
    try {
      const application = await this.applicationRepository.findOne({
        where: { id },
        relations: ['applicant', 'vacancy'],
      });

      if (!application) {
        throw new HttpException('Отклик не найден', HttpStatus.NOT_FOUND);
      }

      application.status = status;
      const saved = await this.applicationRepository.save(application);

      // Уведомляем соискателя
      const applicant = await this.userRepository.findOne({
        where: { id: application.applicantId },
      });
      if (applicant) {
        const statusText =
          status === ApplicationStatus.ACCEPTED ? 'принят' : 'отклонён';
        await this.notificationService.sendNotification(
          applicant.id,
          `Статус отклика изменился`,
          `Ваш отклик на вакансию "${application.vacancy.position}" был ${statusText}`,
          refId,
        );
      }

      this.logger.debug(`[SERVICE] update status SUCCESS id: ${id}`, refId);
      return saved;
    } catch (error) {
      this.logger.error(
        `[ERROR] update status application: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async getApplicationsByVacancy(vacancyId: number, refId: string) {
    this.logger.debug(
      `[SERVICE] get applications by vacancyId: ${vacancyId}`,
      refId,
    );
    try {
      return await this.applicationRepository.find({
        where: { vacancyId },
        relations: ['applicant', 'vacancy'],
      });
    } catch (error) {
      this.logger.error(
        `[ERROR] get applications by vacancy: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async getApplicationsByApplicant(applicantId: number, refId: string) {
    this.logger.debug(
      `[SERVICE] get applications by applicantId: ${applicantId}`,
      refId,
    );
    try {
      return await this.applicationRepository.find({
        where: { applicantId },
        relations: ['applicant', 'vacancy'],
      });
    } catch (error) {
      this.logger.error(
        `[ERROR] get applications by applicant: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async removeApplication(id: number, refId: string) {
    this.logger.debug(`[SERVICE] remove application id: ${id}`, refId);
    try {
      const application = await this.applicationRepository.findOne({
        where: { id },
      });

      if (!application) {
        throw new HttpException('Отклик не найден', HttpStatus.NOT_FOUND);
      }

      await this.applicationRepository.remove(application);
      this.logger.debug(
        `[SERVICE] remove application SUCCESS id: ${id}`,
        refId,
      );
      return application;
    } catch (error) {
      this.logger.error(
        `[ERROR] remove application: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }
}
