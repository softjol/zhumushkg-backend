import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VacancyEntity } from './vacancy.entity';
import { UserEntity } from './user.entity';
import { ResumeEntity } from './resume.entity';

export enum ApplicationStatus {
  NEW = 'NEW',
  REVIEWING = 'REVIEWING',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED',
  HIRED = 'HIRED',
}

@Entity('applications')
export class ApplicationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  vacancy_id: number;

  @ManyToOne(() => VacancyEntity, (vacancy) => vacancy.applications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vacancy_id' })
  vacancy: VacancyEntity;

  @Column()
  candidate_id: number;

  @ManyToOne(() => UserEntity, (user) => user.applications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'candidate_id' })
  candidate: UserEntity;

  @Column()
  resume_id: number;

  @ManyToOne(() => ResumeEntity, (resume) => resume.applications, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'resume_id' })
  resume: ResumeEntity;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.NEW,
  })
  status: ApplicationStatus;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
