import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';
import { CustomLogger } from 'src/helpers/logger/logger.service';
import { UserEntity } from '../database/entitis/user.entity';
import { RoleEntity } from '../database/entitis/role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly logger: CustomLogger,
  ) {}

  async findOneByEmail(email: string, refId: string) {
    this.logger.debug(
      `[SERVICE] find one by email ${JSON.stringify(email)}`,
      refId,
    );
    try {
      this.logger.debug(
        `[SUCCESS] find one by email ${JSON.stringify(email)}`,
        refId,
      );

      return this.userRepository.findOne({
        where: { email },
        relations: ['role'],
      });
    } catch (error) {
      this.logger.error(
        `[ERROR] find one by email ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async sendConfirmationEmail(email: string, token: string) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // твой SMTP
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const confirmationUrl = `http://localhost:3000/auth/confirm-email?token=${token}`;

    await transporter.sendMail({
      from: '"Your App" <no-reply@example.com>',
      to: email,
      subject: 'Подтвердите вашу почту',
      html: `<p>Нажмите на ссылку, чтобы подтвердить почту: <a href="${confirmationUrl}">Подтвердить</a></p>`,
    });
  }

  async createUser(userData: CreateUserDto, refId: string) {
    this.logger.debug(
      `[SERVICE] Creating user with email: ${JSON.stringify(userData.email)}`,
      refId,
    );
    try {
      this.logger.debug(
        `[SUCCESS] Creating user with email: ${JSON.stringify(userData.email)}`,
        refId,
      );
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      let role = await this.roleRepository.findOne({ where: { role: 'USER' } });

      if (!role) {
        role = await this.roleRepository.save({
          role: 'USER',
          description: 'Роль по умолчанию',
        });
      }

      const token = randomBytes(32).toString('hex');

      const user = await this.userRepository.create({
        ...userData,
        password: hashedPassword,
        role: role,
        emailConfirmed: false,
        emailConfirmationToken: token,
      });

      const savedUser = await this.userRepository.save(user);
      await this.sendConfirmationEmail(savedUser.email, token);
      return savedUser;
    } catch (error) {
      this.logger.error(
        `[ERROR] Creating user with email: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async findOneById(decoded, refId: string) {
    this.logger.debug(
      `[SERVICE] find one by id ${JSON.stringify(decoded.id)}`,
      refId,
    );

    try {
      this.logger.debug(
        `[SUCCESS] find one by id ${JSON.stringify(decoded.id)}`,
        refId,
      );
      const user = await this.userRepository.findOne({
        where: { id: decoded },
        relations: ['role'],
      });

      return user;
    } catch (error) {
      this.logger.error(
        `[ERROR] find one by id ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  async findByConfirmationToken(token: string, refId: string) {
    return this.userRepository.findOne({
      where: { emailConfirmationToken: token },
    });
  }

  async save(user: UserEntity) {
    return this.userRepository.save(user);
  }
}
