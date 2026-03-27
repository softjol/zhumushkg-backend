import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ApplicationEntity } from './Application.entity';

@Entity('resumes')
export class ResumeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => UserEntity, (user) => user.resumes)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToMany(() => ApplicationEntity, (application) => application.candidate)
  applications: ApplicationEntity[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  work_schedule: string;

  @Column({ nullable: true })
  payment_period: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary_net: number;

  @Column({ type: 'date', nullable: true })
  birth_date: Date;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  city: string;

  @Column({ type: 'text', nullable: true })
  education: string;

  @Column({ type: 'text', nullable: true })
  work_experience: string;

  @Column({ type: 'simple-array', nullable: true })
  skills: string[];

  @Column({ type: 'text', nullable: true })
  personal_qualities: string;

  @Column({ nullable: true })
  photo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
