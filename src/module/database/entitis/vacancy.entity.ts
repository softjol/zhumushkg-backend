import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApplicationEntity } from './application.entity';
import { UserEntity } from './user.entity';

const salaryNetTransformer = {
  to: (value: number | null | undefined) => value,
  from: (value: string | null): number | null => {
    if (value == null) return null;
    return Math.trunc(Number(value));
  },
};

@Entity('vacancy')
export class VacancyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => UserEntity, (user) => user.vacancies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column()
  position: string;

  @Column({ nullable: true })
  category: string;

  @Column({ name: 'work_schedule' })
  work_schedule: string;

  @Column({ type: 'text', nullable: true })
  requirements: string;

  @Column({ type: 'text', nullable: true })
  conditions: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'experience_work' })
  experience_work: string;

  @Column({ name: 'remote_work', default: false })
  remote_work: boolean;

  @Column()
  city: string;

  @Column({ name: 'work_address' }) // Исправлено adress
  work_address: string;

  @Column()
  region: string;

  @Column({ name: 'payment_period' })
  payment_period: string;

  @Column({
    name: 'salary_net',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: salaryNetTransformer,
  })
  salary_net: number;

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  favorite: number;

  @Column({ default: 0 })
  offers: number;

  @Column()
  company: string;

  @Column({ type: 'text', nullable: true })
  company_description: string;

  @OneToMany(() => ApplicationEntity, (application) => application.vacancy)
  applications: ApplicationEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
