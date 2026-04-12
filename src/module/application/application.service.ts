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
    } catch (error) {
      throw error;
    }
  }

  async findAll(refId: string) {
    this.logger.debug(`[SERVICE] findAll applications`, refId);
    try {
      return await this.applicationRepository.find({
        relations: ['vacancy', 'candidate', 'resume'],
      });
    } catch (error) {
      throw error;
    }
  }

  async findById(id: number, refId: string) {
    this.logger.debug(`[SERVICE] findById ${id}`, refId);
    try {
      const application = await this.applicationRepository.findOne({
        where: { id },
        relations: ['vacancy', 'candidate', 'resume'],
      });
      return application;
    } catch (error) {
      throw error;
    }
  }

  // ── Главный метод — здесь открывается чат ──────────────────────────────────
  async updateStatus(
    id: number,
    status: ApplicationStatus,
    hrId: number, // ← добавить параметр (id HR из JWT, когда подключат auth)
    refId: string,
  ) {
    this.logger.debug(
      `[SERVICE] updateStatus application ${id} → ${status}`,
      refId,
    );

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
      const saved = await this.applicationRepository.save(application);

      if (STATUSES_THAT_OPEN_CHAT.includes(status)) {
        const chat = await this.chatService.openChatFromApplication(
          hrId, // HR который меняет статус
          application.candidate_id, // кандидат из отклика
          application.vacancy_id, // вакансия из отклика
          application.id, // сам отклик
        );

        // Уведомляем кандидата через WebSocket если он онлайн
        this.chatGateway.notifyNewChat(application.candidate_id, chat);

        this.logger.debug(
          `[SERVICE] Chat opened: chatId=${chat.id} for application ${id}`,
          refId,
        );
      }

      return saved;
    } catch (error) {
      throw error;
    }
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
