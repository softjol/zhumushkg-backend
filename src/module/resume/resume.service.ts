import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResumeEntity } from '../database/entitis/resume.entity';
import { Repository } from 'typeorm';
import { CustomLogger } from 'src/helpers/logger/logger.service';
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
}
