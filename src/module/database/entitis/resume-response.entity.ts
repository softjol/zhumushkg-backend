import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ResumeEntity } from './resume.entity';

export enum ResumeResponseStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('resume_response')
export class ResumeResponseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Работодатель
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employer_id' })
  employer: UserEntity;

  @Column({ name: 'employer_id' })
  employerId: number;

  // Резюме соискателя
  @ManyToOne(() => ResumeEntity)
  @JoinColumn({ name: 'resume_id' })
  resume: ResumeEntity;

  @Column({ name: 'resume_id' })
  resumeId: number;

  @Column({
    type: 'enum',
    enum: ResumeResponseStatus,
    default: ResumeResponseStatus.PENDING,
  })
  status: ResumeResponseStatus;

  @CreateDateColumn()
  createdAt: Date;
}
