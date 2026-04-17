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
import { CreateApplicationDto } from './dto/application.dto';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import { ChatService } from '../messages/chat.service';
import { ChatGateway } from '../messages/chat.gateway';

const STATUSES_THAT_OPEN_CHAT = [
  ApplicationStatus.REVIEWING,
  ApplicationStatus.INTERVIEW,
];

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
    private readonly logger: CustomLogger,
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async create(dto: CreateApplicationDto, userId: number, refId: string) {
    this.logger.debug(
      `[SERVICE] Creating application vacancyId=${dto.vacancy_id}, userId=${userId}`,
      refId,
    );

    try {
      const existing = await this.applicationRepository.findOne({
        where: {
          vacancy_id: dto.vacancy_id,
          candidate_id: userId,
        },
      });

      if (existing) {
        this.logger.warn(
          `[WARN] create application already exists: vacancyId=${dto.vacancy_id}, userId=${userId}`,
          refId,
        );
        throw new ConflictException('You have already applied to this vacancy');
      }

      const application = this.applicationRepository.create({
        vacancy_id: dto.vacancy_id,
        candidate_id: userId,
        resume_id: dto.resume_id,
        status: dto.status ?? ApplicationStatus.NEW,
      });

      const saved = await this.applicationRepository.save(application);
      this.logger.debug(
        `[SUCCESS] create application applicationId=${saved.id}, userId=${userId}`,
        refId,
      );
      return saved;
    } catch (error) {
      this.logger.error(
        `[ERROR] create application vacancyId=${dto.vacancy_id}, userId=${userId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async findAll(userId: number, refId: string) {
    this.logger.debug(`[SERVICE] findAll applications userId=${userId}`, refId);

    try {
      const applications = await this.applicationRepository.find({
        relations: ['vacancy', 'candidate', 'resume'],
      });

      this.logger.debug(
        `[SUCCESS] findAll applications count=${applications.length}, userId=${userId}`,
        refId,
      );
      return applications;
    } catch (error) {
      this.logger.error(
        `[ERROR] findAll applications userId=${userId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async findById(id: number, userId: number, refId: string) {
    this.logger.debug(
      `[SERVICE] findById applicationId=${id}, userId=${userId}`,
      refId,
    );

    try {
      const application = await this.applicationRepository.findOne({
        where: { id },
        relations: ['vacancy', 'candidate', 'resume'],
      });

      if (!application) {
        this.logger.warn(
          `[WARN] findById application not found: applicationId=${id}`,
          refId,
        );
        throw new NotFoundException(`Application #${id} not found`);
      }

      this.logger.debug(
        `[SUCCESS] findById applicationId=${id}, userId=${userId}`,
        refId,
      );
      return application;
    } catch (error) {
      this.logger.error(
        `[ERROR] findById applicationId=${id}, userId=${userId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async updateStatus(
    id: number,
    status: ApplicationStatus,
    userId: number,
    refId: string,
  ) {
    this.logger.debug(
      `[SERVICE] updateStatus applicationId=${id}, status=${status}, userId=${userId}`,
      refId,
    );

    try {
      const application = await this.applicationRepository.findOne({
        where: { id },
      });

      if (!application) {
        this.logger.warn(
          `[WARN] updateStatus application not found: applicationId=${id}`,
          refId,
        );
        throw new NotFoundException(`Application #${id} not found`);
      }

      if (application.status === ApplicationStatus.HIRED) {
        this.logger.warn(
          `[WARN] updateStatus cannot change status of hired candidate: applicationId=${id}`,
          refId,
        );
        throw new BadRequestException(
          'Cannot change status of a hired candidate',
        );
      }

      application.status = status;
      const saved = await this.applicationRepository.save(application);

      if (STATUSES_THAT_OPEN_CHAT.includes(status)) {
        const chat = await this.chatService.openChatFromApplication(
          userId,
          application.candidate_id,
          application.vacancy_id,
          application.id,
          refId,
        );

        this.chatGateway.notifyNewChat(application.candidate_id, chat);

        this.logger.debug(
          `[SUCCESS] updateStatus chat opened: chatId=${chat.id}, applicationId=${id}`,
          refId,
        );
      }

      this.logger.debug(
        `[SUCCESS] updateStatus applicationId=${id}, status=${status}, userId=${userId}`,
        refId,
      );
      return saved;
    } catch (error) {
      this.logger.error(
        `[ERROR] updateStatus applicationId=${id}, status=${status}, userId=${userId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async remove(id: number, userId: number, refId: string): Promise<void> {
    this.logger.debug(
      `[SERVICE] remove applicationId=${id}, userId=${userId}`,
      refId,
    );

    try {
      const application = await this.applicationRepository.findOne({
        where: { id },
      });

      if (!application) {
        this.logger.warn(
          `[WARN] remove application not found: applicationId=${id}`,
          refId,
        );
        throw new NotFoundException(`Application #${id} not found`);
      }

      if (
        [ApplicationStatus.OFFER, ApplicationStatus.HIRED].includes(
          application.status,
        )
      ) {
        this.logger.warn(
          `[WARN] remove cannot withdraw at this stage: applicationId=${id}, status=${application.status}`,
          refId,
        );
        throw new ConflictException(
          'Cannot withdraw application at this stage',
        );
      }

      await this.applicationRepository.delete(id);
      this.logger.debug(
        `[SUCCESS] remove applicationId=${id}, userId=${userId}`,
        refId,
      );
    } catch (error) {
      this.logger.error(
        `[ERROR] remove applicationId=${id}, userId=${userId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }
}
