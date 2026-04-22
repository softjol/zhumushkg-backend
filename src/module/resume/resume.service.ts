import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResumeEntity } from '../database/entitis/resume.entity';
import { ApplicationEntity } from '../database/entitis/application.entity';
import { ResumeResponseEntity } from '../database/entitis/resume-response.entity';
import { Repository } from 'typeorm';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { CreateResumeDto } from './dto/resume.dto';

@Injectable()
export class ResumeService {
  constructor(
    @InjectRepository(ResumeEntity)
    private resumeRepository: Repository<ResumeEntity>,
    private readonly logger: CustomLogger,
  ) {}

  async createResume(resumeData: CreateResumeDto, refId: string) {
    this.logger.debug(
      `[SERVICE] create resume: ${JSON.stringify(resumeData)}`,
      refId,
    );

    try {
      const resume = this.resumeRepository.create(resumeData);
      this.logger.debug(
        `[SERVICE] create resume SUCCESS: ${JSON.stringify(resume)}`,
        refId,
      );
      return await this.resumeRepository.save(resume);
    } catch (error) {
      this.logger.error(`[SERVICE] error creating resume: ${error}`, refId);
      throw error;
    }
  }

  async getAllResume(refId: string) {
    this.logger.debug(`[SERVICE] get all resume`, refId);
    try {
      return await this.resumeRepository.find();
    } catch (error) {
      this.logger.error(`[SERVICE] error getting all resume: ${error}`, refId);
      throw error;
    }
  }

  async getMyResumes(userId: number, refId: string) {
    this.logger.debug(`[SERVICE] get my resumes userId=${userId}`, refId);
    try {
      return await this.resumeRepository.find({
        where: { user_id: userId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `[SERVICE] error getting my resumes userId=${userId}: ${error}`,
        refId,
      );
      throw error;
    }
  }

  async getResumeById(id: number, refId: string) {
    this.logger.debug(`[SERVICE] get resume by id ${id}`, refId);
    try {
      return await this.resumeRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error(
        `[SERVICE] error getting resume by id ${id}: ${error}`,
        refId,
      );
      throw error;
    }
  }
  async removeResume(
    id: number,
    userId: number,
    refId: string,
  ): Promise<ResumeEntity> {
    this.logger.debug(
      `[SERVICE] Attempting to remove resume ${id} by user ${userId}`,
      refId,
    );

    const resume = await this.resumeRepository.findOne({ where: { id } });

    if (!resume) {
      this.logger.warn(`[SERVICE] Resume with id ${id} not found`, refId);
      throw new NotFoundException(`Resume with ID ${id} not found`);
    }

    if (resume.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own resume');
    }

    try {
      await this.resumeRepository.manager.transaction(async (manager) => {
        await manager.delete(ApplicationEntity, { resume_id: id });
        await manager.delete(ResumeResponseEntity, { resumeId: id });
        await manager.delete(ResumeEntity, { id });
      });
      this.logger.debug(`[SERVICE] Resume ${id} successfully removed`, refId);
      return resume;
    } catch (error) {
      this.logger.error(
        `[SERVICE] Failed to remove resume ${id}: ${error}`,
        refId,
      );
      throw new InternalServerErrorException(
        'Error occurred while deleting resume',
      );
    }
  }

  /**
   * Обновление резюме
   */
  async updateResume(
    id: number,
    resumeData: CreateResumeDto,
    refId: string,
  ): Promise<ResumeEntity> {
    this.logger.debug(`[SERVICE] Attempting to update resume ${id}`, refId);

    // 1. Проверяем существование
    const resume = await this.resumeRepository.findOne({ where: { id } });

    if (!resume) {
      this.logger.warn(
        `[SERVICE] Resume with id ${id} not found for update`,
        refId,
      );
      throw new NotFoundException(`Resume with ID ${id} not found`);
    }

    // 2. Слияние данных и сохранение
    // Используем preload или Object.assign для обновления полей
    const updatedResume = Object.assign(resume, resumeData);

    try {
      const savedResume = await this.resumeRepository.save(updatedResume);
      this.logger.debug(`[SERVICE] Resume ${id} successfully updated`, refId);
      return savedResume;
    } catch (error) {
      this.logger.error(`[SERVICE] Failed to update resume ${id}`, refId);
      throw new InternalServerErrorException(
        'Error occurred while updating resume',
      );
    }
  }
}
