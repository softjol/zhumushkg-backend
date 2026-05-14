import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ApplicationEntity } from './application.entity';
import { VacancyEntity } from './vacancy.entity';

export enum ChatSource {
  APPLICATION = 'APPLICATION', // диалог после отклика кандидата на вакансию
  RESUME = 'RESUME', // HR нашёл резюме и написал первым
}

export enum ChatStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

// Уникальность: один чат на пару hr + кандидат + вакансия
@Entity('chats')
@Unique(['hr_id', 'candidate_id', 'vacancy_id'])
export class ChatEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // ─── HR ────────────────────────────────────────────────────────────────────
  @Column()
  hr_id: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hr_id' })
  hr: UserEntity;

  // ─── Кандидат ───────────────────────────────────────────────────────────────
  @Column()
  candidate_id: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: UserEntity;

  // ─── Вакансия (опционально — HR может написать без привязки к вакансии) ────
  @Column({ nullable: true })
  vacancy_id: number | null;

  @ManyToOne(() => VacancyEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vacancy_id' })
  vacancy: VacancyEntity | null;

  // ─── Отклик (только для сценария APPLICATION) ──────────────────────────────
  @Column({ nullable: true })
  application_id: number | null;

  @ManyToOne(() => ApplicationEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'application_id' })
  application: ApplicationEntity | null;

  // ─── Мета ───────────────────────────────────────────────────────────────────
  @Column({ type: 'enum', enum: ChatSource })
  source: ChatSource;

  @Column({ type: 'enum', enum: ChatStatus, default: ChatStatus.ACTIVE })
  status: ChatStatus;

  @Column({ type: 'timestamp', nullable: true })
  last_message_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  // ─── Сообщения ──────────────────────────────────────────────────────────────
  @OneToMany(() => MessageEntity, (message) => message.chat)
  messages: MessageEntity[];
}

@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  chat_id: number;

  @ManyToOne(() => ChatEntity, (chat) => chat.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat: ChatEntity;

  // sender_id — это id из UserEntity (и hr и кандидат — оба UserEntity)
  @Column()
  sender_id: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: UserEntity;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  is_read: boolean;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
