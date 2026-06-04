import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateUserDto } from './dto/user.dto';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { UserEntity } from '../database/entitis/user.entity';
import { RoleEntity } from '../database/entitis/role.entity';
import { NotificationEntity } from '../database/entitis/notification.entitity';
import { ResumeResponseEntity } from '../database/entitis/resume-response.entity';
import { ChatEntity, MessageEntity } from '../database/entitis/chat.entity';
import { AppUserRole } from '../../common/constants/app-user-role';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { randomInt } from 'crypto';

// Rate-limit для SMS: храним время последней отправки в памяти
const smsRateLimit = new Map<string, Date>();

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly dataSource: DataSource,
    private readonly logger: CustomLogger,
    private readonly whatsappService: WhatsappService,
  ) {}

  async findOneByPhoneNumber(phoneNumber: string, refId: string) {
    this.logger.debug(
      `[SERVICE] find one by phoneNumber ${JSON.stringify(phoneNumber)}`,
      refId,
    );
    try {
      this.logger.debug(
        `[SUCCESS] find one by phoneNumber ${JSON.stringify(phoneNumber)}`,
        refId,
      );
      return this.userRepository.findOne({
        where: { phoneNumber },
        relations: ['role'],
      });
    } catch (error) {
      this.logger.error(
        `[ERROR] find one by phoneNumber ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async removeById(
    id: number,
    refId: string,
    options?: { actingUserId?: number },
  ): Promise<void> {
    this.logger.debug(`[SERVICE] remove user id=${id}`, refId);

    if (options?.actingUserId != null && options.actingUserId === id) {
      throw new BadRequestException(
        'Нельзя удалить собственную учётную запись',
      );
    }

    const existing = await this.userRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }

    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(MessageEntity)
        .where(
          'chat_id IN (SELECT id FROM chats WHERE hr_id = :id OR candidate_id = :id)',
          { id },
        )
        .execute();

      await manager
        .createQueryBuilder()
        .delete()
        .from(ChatEntity)
        .where('hr_id = :id OR candidate_id = :id', { id })
        .execute();

      await manager.delete(NotificationEntity, { userId: id });
      await manager.delete(ResumeResponseEntity, { employerId: id });

      await manager.query(`DELETE FROM email_verification WHERE user_id = $1`, [
        id,
      ]);

      const result = await manager.delete(UserEntity, { id });
      if (!result.affected) {
        throw new NotFoundException(`Пользователь #${id} не найден`);
      }
    });
  }

  private generateSmsCode(): string {
    return randomInt(1000, 10000).toString();
  }

  /** Гарантирует строки ролей соискатель / работодатель в таблице role. */
  async ensureAppRoles(refId: string): Promise<void> {
    const pairs: [AppUserRole, string][] = [
      [AppUserRole.JOB_SEEKER, 'Соискатель'],
      [AppUserRole.EMPLOYER, 'Работодатель'],
    ];
    for (const [roleName, description] of pairs) {
      const existing = await this.roleRepository.findOne({
        where: { role: roleName },
      });
      if (!existing) {
        await this.roleRepository.save({ role: roleName, description });
        this.logger.debug(`[SERVICE] Created role ${roleName}`, refId);
      }
    }
  }

  async switchUserRole(
    userId: number,
    targetRole: AppUserRole,
    refId: string,
  ): Promise<UserEntity> {
    await this.ensureAppRoles(refId);
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException(`Пользователь #${userId} не найден`);
    }
    const currentName = user.role?.role ?? '';
    const effective: AppUserRole =
      currentName === 'USER'
        ? AppUserRole.JOB_SEEKER
        : (currentName as AppUserRole);

    if (
      effective !== AppUserRole.JOB_SEEKER &&
      effective !== AppUserRole.EMPLOYER
    ) {
      throw new BadRequestException(
        'Переключение роли доступно только для соискателя и работодателя',
      );
    }
    if (effective === targetRole) {
      return user;
    }
    if (
      (effective === AppUserRole.JOB_SEEKER &&
        targetRole !== AppUserRole.EMPLOYER) ||
      (effective === AppUserRole.EMPLOYER &&
        targetRole !== AppUserRole.JOB_SEEKER)
    ) {
      throw new BadRequestException(
        'Можно переключаться только между соискателем (JOB_SEEKER) и работодателем (EMPLOYER)',
      );
    }

    const nextRole = await this.roleRepository.findOne({
      where: { role: targetRole },
    });
    if (!nextRole) {
      throw new BadRequestException(`Роль ${targetRole} не найдена в БД`);
    }
    user.role = nextRole;
    await this.userRepository.save(user);
    const reloaded = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!reloaded) {
      throw new NotFoundException(`Пользователь #${userId} не найден`);
    }
    return reloaded;
  }

  async sendConfirmationCode(
    phoneNumber: string,
    code: string,
    refId: string,
  ): Promise<void> {
    try {
      await this.whatsappService.sendOtp(phoneNumber, code);
      this.logger.debug(`[WhatsApp] Код отправлен на ${phoneNumber}`, refId);
    } catch (e) {
      this.logger.error(
        `[WhatsApp] Не удалось отправить код на ${phoneNumber}: ${String(e)}`,
        refId,
      );
    }
  }

  async createUser(userData: CreateUserDto, refId: string) {
    this.logger.debug(
      `[SERVICE] Creating user with phoneNumber: ${JSON.stringify(userData.phoneNumber)}`,
      refId,
    );
    try {
      await this.ensureAppRoles(refId);
      const targetRole = userData.role ?? AppUserRole.JOB_SEEKER;
      const role = await this.roleRepository.findOne({
        where: { role: targetRole },
      });
      if (!role) {
        throw new BadRequestException(
          `Роль ${targetRole} не найдена после инициализации`,
        );
      }

      const smsCode = this.generateSmsCode();

      const user = this.userRepository.create({
        firstName: userData.firstName,
        phoneNumber: userData.phoneNumber,
        role: role,
        phoneConfirmed: false,
        smsCode: smsCode,
        isBanned: false,
      });

      const savedUser = await this.userRepository.save(user);
      await this.sendConfirmationCode(savedUser.phoneNumber, smsCode, refId);

      this.logger.debug(
        `[SUCCESS] Creating user with phoneNumber: ${JSON.stringify(userData.phoneNumber)}`,
        refId,
      );
      return savedUser;
    } catch (error) {
      this.logger.error(
        `[ERROR] Creating user with phoneNumber: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async findOneById(decoded: number, refId: string) {
    this.logger.debug(
      `[SERVICE] find one by id ${JSON.stringify(decoded)}`,
      refId,
    );
    try {
      const user = await this.userRepository.findOne({
        where: { id: decoded },
        relations: ['role'],
      });
      this.logger.debug(
        `[SUCCESS] find one by id ${JSON.stringify(decoded)}`,
        refId,
      );
      return user;
    } catch (error) {
      this.logger.error(
        `[ERROR] find one by id ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async findByPhoneConfirmationToken(smsCode: string, refId: string) {
    this.logger.debug(`[SERVICE] find by SMS code`, refId);
    try {
      return this.userRepository.findOne({
        where: { smsCode },
        relations: ['role'],
      });
    } catch (error) {
      this.logger.error(
        `[ERROR] find by SMS code ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async findByPhoneAndSmsCode(
    phoneNumber: string,
    smsCode: string,
    refId: string,
  ) {
    this.logger.debug(`[SERVICE] find by phone + SMS code`, refId);
    try {
      return this.userRepository.findOne({
        where: { phoneNumber, smsCode },
        relations: ['role'],
      });
    } catch (error) {
      this.logger.error(
        `[ERROR] find by phone + SMS code ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async findByConfirmationToken(smsCode: string) {
    return this.userRepository.findOne({ where: { smsCode } });
  }

  async save(user: UserEntity) {
    return this.userRepository.save(user);
  }

  async updateSmsCodeAndSend(phoneNumber: string, refId: string) {
    const user = await this.findOneByPhoneNumber(phoneNumber, refId);
    if (!user) {
      throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
    }
    if (user.isBanned) {
      throw new HttpException(
        'Пользователь заблокирован',
        HttpStatus.FORBIDDEN,
      );
    }
    // Rate-limit: не чаще 1 раза в 60 секунд
    const lastSent = smsRateLimit.get(phoneNumber);
    if (lastSent && Date.now() - lastSent.getTime() < 60_000) {
      const secLeft = Math.ceil((60_000 - (Date.now() - lastSent.getTime())) / 1000);
      throw new HttpException(
        `Подождите ${secLeft} сек. перед повторной отправкой`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const newCode = this.generateSmsCode();
    user.smsCode = newCode;
    smsRateLimit.set(phoneNumber, new Date());
    await this.save(user);
    await this.sendConfirmationCode(phoneNumber, newCode, refId);
    return newCode;
  }

  async setBanStatus(userId: number, refId: string): Promise<UserEntity> {
    const user = await this.findOneById(userId, refId);
    if (!user) {
      throw new NotFoundException(`Пользователь #${userId} не найден`);
    }
    user.isBanned = !user.isBanned;
    return await this.userRepository.save(user);
  }

  async getUsersByRoleWithRelations(role: AppUserRole, refId: string) {
    this.logger.debug(`[SERVICE] get users by role ${role}`, refId);
    const relation = role === AppUserRole.JOB_SEEKER ? 'resumes' : 'vacancies';
    return await this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'r')
      .leftJoinAndSelect(`u.${relation}`, relation)
      .where('r.role = :role', { role })
      .orderBy('u.id', 'DESC')
      .getMany();
  }
}
