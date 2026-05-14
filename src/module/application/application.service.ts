import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApplicationEntity,
  ApplicationStatus,
} from '../database/entitis/application.entity';
import { ResumeEntity } from '../database/entitis/resume.entity';
import { VacancyEntity } from '../database/entitis/vacancy.entity';
import { CreateApplicationDto } from './dto/application.dto';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import { ChatService } from '../messages/chat.service';
import { ChatGateway } from '../messages/chat.gateway';
import { NotificationService } from '../notification/notificant.service';

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
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly notificationService: NotificationService,
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
    const saved = await this.applicationRepository.save(application);

    const hrId = vacancy.user_id;
    const { chat, created: chatCreated } =
      await this.chatService.openChatFromApplication(
        hrId,
        candidateId,
        dto.vacancy_id,
        saved.id,
        refId,
      );

    if (chatCreated) {
      this.chatGateway.notifyNewChat(hrId, chat);
      this.chatGateway.notifyNewChat(candidateId, chat);
      await this.notificationService.sendNotification(
        hrId,
        'Новый отклик на вакансию',
        'Откройте чат, чтобы связаться с кандидатом',
        'http-chat',
      );
    }

    return { ...saved, chat };
  }

  async findAll(actingRole: string | undefined, refId: string) {
    this.logger.debug(`[SERVICE] findAll applications`, refId);
    if (actingRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Только администратор может видеть все отклики',
      );
    }

    return await this.applicationRepository.find({
      relations: ['vacancy', 'candidate', 'resume'],
    });
  }

  async findMy(candidateId: number, refId: string) {
    this.logger.debug(
      `[SERVICE] find applications for candidateId=${candidateId}`,
      refId,
    );
    return await this.applicationRepository.find({
      where: { candidate_id: candidateId },
      relations: ['vacancy', 'resume'],
      order: { created_at: 'DESC' },
    });
  }

  async findById(
    id: number,
    actingUserId: number,
    actingRole: string | undefined,
    refId: string,
  ) {
    this.logger.debug(`[SERVICE] find application by id=${id}`, refId);
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['vacancy', 'candidate', 'resume'],
    });

    if (!application) {
      throw new NotFoundException(`Application #${id} not found`);
    }

    if (actingRole !== 'ADMIN' && application.candidate_id !== actingUserId) {
      throw new ForbiddenException('Можно смотреть только свои отклики');
    }

    return application;
  }

  async updateStatus(
    id: number,
    status: ApplicationStatus,
    employerUserId: number,
    refId: string,
  ) {
    this.logger.debug(
      `[SERVICE] update application status id=${id} status=${status}`,
      refId,
    );
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['vacancy'],
    });

    if (!application) {
      throw new NotFoundException(`Application #${id} not found`);
    }

    if (application.vacancy.user_id !== employerUserId) {
      throw new ForbiddenException(
        'Только автор вакансии может менять статус отклика',
      );
    }

    if (application.status === ApplicationStatus.HIRED) {
      throw new BadRequestException(
        'Cannot change status of a hired candidate',
      );
    }

    const previousStatus = application.status;
    application.status = status;
    const saved = await this.applicationRepository.save(application);

    if (previousStatus !== status) {
      const { chat, created } =
        await this.chatService.openChatFromApplication(
          employerUserId,
          saved.candidate_id,
          saved.vacancy_id,
          saved.id,
          refId,
        );

      if (created) {
        this.chatGateway.notifyNewChat(saved.candidate_id, chat);
        await this.notificationService.sendNotification(
          saved.candidate_id,
          'Работодатель ответил на ваш отклик',
          'Откройте чат, чтобы продолжить общение',
          'http-chat',
        );
      }

      return { ...saved, chat };
    }

    return saved;
  }

  async remove(
    id: number,
    actingUserId: number,
    actingRole: string | undefined,
    refId: string,
  ): Promise<void> {
    this.logger.debug(`[SERVICE] remove application id=${id}`, refId);
    const application = await this.applicationRepository.findOne({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException(`Application #${id} not found`);
    }

    if (actingRole !== 'ADMIN' && application.candidate_id !== actingUserId) {
      throw new ForbiddenException('Можно удалять только свои отклики');
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
