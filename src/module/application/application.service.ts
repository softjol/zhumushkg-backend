import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApplicationEntity,
  ApplicationStatus,
} from '../database/entitis/application.entity';
import { CreateApplicationDto } from './dto/application.dto';
import { CustomLogger } from 'src/helpers/logger/logger.service';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
    private readonly logger: CustomLogger,
  ) {}

  async create(dto: CreateApplicationDto, refId: string) {
    this.logger.debug(
      `[SERVICE] Creating application for vacancy ${dto.vacancy_id}`,
      refId,
    );

    try {
      const existing = await this.applicationRepository.findOne({
        where: {
          vacancy_id: dto.vacancy_id,
          candidate_id: dto.candidate_id,
        },
      });

      if (existing) {
        throw new ConflictException('You have already applied to this vacancy');
      }

      const application = this.applicationRepository.create({
        vacancy_id: dto.vacancy_id,
        candidate_id: dto.candidate_id,
        resume_id: dto.resume_id,
        status: dto.status ?? ApplicationStatus.NEW,
      });
      return await this.applicationRepository.save(application);
    } catch (error) {}
  }

  async findAll(refId: string) {
    this.logger.debug(`[SERVICE] Creating application for vacancy`, refId);
    try {
      return await this.applicationRepository.find({
        relations: ['vacancy', 'candidate', 'resume'],
      });
    } catch (error) {}
  }

  async findById(id, refId) {
    this.logger.debug(`[SERVICE] `, refId);
    try {
      const application = await this.applicationRepository.findOne({
        where: { id },
        relations: ['vacancy', 'candidate', 'resume'],
      });

      return application;
    } catch (error) {}
  }

  async updateStatus(id: number, status: ApplicationStatus, refId: string) {
    const application = await this.applicationRepository.findOne({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException(`Application #${id} not found`);
    }

    try {
      if (application.status === ApplicationStatus.HIRED) {
        throw new BadRequestException(
          'Cannot change status of a hired candidate',
        );
      }

      application.status = status;
      return await this.applicationRepository.save(application);
    } catch (error) {}
  }

  async remove(id: number, refId: string): Promise<void> {
    const application = await this.applicationRepository.findOne({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException(`Application #${id} not found`);
    }

    if (
      [ApplicationStatus.OFFER, ApplicationStatus.HIRED].includes(
        application.status,
      )
    ) {
      throw new ConflictException('Cannot withdraw application at this stage');
    }

    await this.applicationRepository.delete(id);
  }
}
