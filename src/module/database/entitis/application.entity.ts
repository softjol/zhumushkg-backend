import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { VacancyEntity } from './vacancy.enity';

export enum ApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('application')
export class ApplicationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'applicant_id' })
  applicant: UserEntity;

  @Column({ name: 'applicant_id' })
  applicantId: number;

  @ManyToOne(() => VacancyEntity)
  @JoinColumn({ name: 'vacancy_id' })
  vacancy: VacancyEntity;

  @Column({ name: 'vacancy_id' })
  vacancyId: number;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  @CreateDateColumn()
  createdAt: Date;
}
