import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ResumeResponseEntity,
  ResumeResponseStatus,
} from '../../database/entitis/resume-response.entity';
import { CustomLogger } from '../../../helpers/logger/logger.service';
import { NotificationService } from '../../notification/notificant.service';
import { UserEntity } from '../../database/entitis/user.entity';
import { ResumeEntity } from '../../database/entitis/resume.entity';

@Injectable()
export class ResumeResponseService {
  constructor(
    @InjectRepository(ResumeResponseEntity)
    private readonly resumeResponseRepository: Repository<ResumeResponseEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ResumeEntity)
    private readonly resumeRepository: Repository<ResumeEntity>,
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
  ) {}

  async createResponse(employerId: number, resumeId: number, refId: string) {
    this.logger.debug(
      `[SERVICE] create response employerId: ${employerId} resumeId: ${resumeId}`,
      refId,
    );
    try {
      const existing = await this.resumeResponseRepository.findOne({
        where: { employerId, resumeId },
      });

      if (existing) {
        throw new HttpException(
          'Вы уже откликались на это резюме',
          HttpStatus.BAD_REQUEST,
        );
      }

      const response = this.resumeResponseRepository.create({
        employerId,
        resumeId,
        status: ResumeResponseStatus.PENDING,
      });

      const saved = await this.resumeResponseRepository.save(response);

      // Находим резюме и его владельца
      const resume = await this.resumeRepository.findOne({
        where: { id: resumeId },
      });
      const employer = await this.userRepository.findOne({
        where: { id: employerId },
      });

      if (resume && employer) {
        const applicant = await this.userRepository.findOne({
          where: { id: resume.user_id },
        });
        if (applicant) {
          await this.notificationService.sendNotification(
            applicant.id,
            'Новый отклик на ваше резюме',
            `${employer.firstName} заинтересован в вашем резюме`,
            refId,
          );
        }
      }

      this.logger.debug(
        `[SERVICE] create response SUCCESS id: ${saved.id}`,
        refId,
      );
      return saved;
    } catch (error) {
      this.logger.error(
        `[ERROR] create response: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async updateStatus(
    id: number,
    status: ResumeResponseStatus,
    actingUserId: number,
    refId: string,
  ) {
    this.logger.debug(
      `[SERVICE] update status response id: ${id} status: ${status}`,
      refId,
    );
    try {
      const response = await this.resumeResponseRepository.findOne({
        where: { id },
        relations: ['employer', 'resume'],
      });

      if (!response) {
        throw new HttpException('Отклик не найден', HttpStatus.NOT_FOUND);
      }

      if (response.resume.user_id !== actingUserId) {
        throw new ForbiddenException(
          'Только владелец резюме может менять статус отклика работодателя',
        );
      }

      response.status = status;
      const saved = await this.resumeResponseRepository.save(response);

      // Уведомляем работодателя
      const employer = await this.userRepository.findOne({
        where: { id: response.employerId },
      });
      if (employer) {
        const statusText =
          status === ResumeResponseStatus.ACCEPTED ? 'принят' : 'отклонён';
        await this.notificationService.sendNotification(
          employer.id,
          'Статус отклика изменился',
          `Соискатель ${statusText} ваш отклик на резюме`,
          refId,
        );
      }

      this.logger.debug(`[SERVICE] update status SUCCESS id: ${id}`, refId);
      return saved;
    } catch (error) {
      this.logger.error(
        `[ERROR] update status response: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async getResponsesByResume(resumeId: number, refId: string) {
    this.logger.debug(
      `[SERVICE] get responses by resumeId: ${resumeId}`,
      refId,
    );
    try {
      return await this.resumeResponseRepository.find({
        where: { resumeId },
        relations: ['employer', 'resume'],
      });
    } catch (error) {
      this.logger.error(
        `[ERROR] get responses by resume: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async getResponsesByEmployer(employerId: number, refId: string) {
    this.logger.debug(
      `[SERVICE] get responses by employerId: ${employerId}`,
      refId,
    );
    try {
      return await this.resumeResponseRepository.find({
        where: { employerId },
        relations: ['employer', 'resume'],
      });
    } catch (error) {
      this.logger.error(
        `[ERROR] get responses by employer: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async removeResponse(id: number, refId: string) {
    this.logger.debug(`[SERVICE] remove response id: ${id}`, refId);
    try {
      const response = await this.resumeResponseRepository.findOne({
        where: { id },
      });

      if (!response) {
        throw new HttpException('Отклик не найден', HttpStatus.NOT_FOUND);
      }

      await this.resumeResponseRepository.remove(response);
      this.logger.debug(`[SERVICE] remove response SUCCESS id: ${id}`, refId);
      return response;
    } catch (error) {
      this.logger.error(
        `[ERROR] remove response: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }
}
