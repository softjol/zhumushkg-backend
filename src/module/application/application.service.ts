import {
  Injectable,
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
import { ResumeEntity } from '../database/entitis/resume.entity';
import { VacancyEntity } from '../database/entitis/vacancy.enity';
import { CreateApplicationDto } from './dto/application.dto';
import { CustomLogger } from 'src/helpers/logger/logger.service';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
    @InjectRepository(ResumeEntity)
    private readonly resumeRepository: Repository<ResumeEntity>,
    @InjectRepository(VacancyEntity)
    private readonly vacancyRepository: Repository<VacancyEntity>,
    private readonly logger: CustomLogger,
  ) {}

  async create(dto: CreateApplicationDto, candidateId: number, refId: string) {
    this.logger.debug(
      `[SERVICE] Creating application for vacancy ${dto.vacancy_id} candidateId=${candidateId}`,
      refId,
    );

    const vacancy = await this.vacancyRepository.findOne({
      where: { id: dto.vacancy_id },
    });
    if (!vacancy) {
      throw new NotFoundException(`Vacancy #${dto.vacancy_id} not found`);
    }

    const resume = await this.resumeRepository.findOne({
      where: { id: dto.resume_id },
    });
    if (!resume) {
      throw new NotFoundException(`Resume #${dto.resume_id} not found`);
    }
    if (resume.user_id !== candidateId) {
      throw new BadRequestException('Resume does not belong to current user');
    }

    const existing = await this.applicationRepository.findOne({
      where: {
        vacancy_id: dto.vacancy_id,
        candidate_id: candidateId,
      },
    });
    if (existing) {
      throw new ConflictException('You have already applied to this vacancy');
    }

    const application = this.applicationRepository.create({
      vacancy_id: dto.vacancy_id,
      candidate_id: candidateId,
      resume_id: dto.resume_id,
      status: ApplicationStatus.NEW,
    });
    return await this.applicationRepository.save(application);
  }

  async findAll(refId: string) {
    this.logger.debug(`[SERVICE] Creating application for vacancy`, refId);
    return await this.applicationRepository.find({
      relations: ['vacancy', 'candidate', 'resume'],
    });
  }

  async findById(id: number, refId: string) {
    this.logger.debug(`[SERVICE] find application by id=${id}`, refId);
    return await this.applicationRepository.findOne({
      where: { id },
      relations: ['vacancy', 'candidate', 'resume'],
    });
  }

  async updateStatus(id: number, status: ApplicationStatus, refId: string) {
    this.logger.debug(
      `[SERVICE] update application status id=${id} status=${status}`,
      refId,
    );
    const application = await this.applicationRepository.findOne({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException(`Application #${id} not found`);
    }

    if (application.status === ApplicationStatus.HIRED) {
      throw new BadRequestException(
        'Cannot change status of a hired candidate',
      );
    }

    application.status = status;
    return await this.applicationRepository.save(application);
  }

  async remove(id: number, refId: string): Promise<void> {
    this.logger.debug(`[SERVICE] remove application id=${id}`, refId);
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
