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
import { ApplicationEntity } from './application.entity';

/** Одна запись опыта работы (см. WorkExperienceEntryDto). */
export type ResumeWorkExperienceEntry = {
  company: string;
  position: string;
  start_month: number;
  start_year: number;
  until_now: boolean;
  end_month?: number | null;
  end_year?: number | null;
  description: string;
};

const resumeSalaryNetTransformer = {
  to: (value: number | null | undefined) => value,
  from: (value: string | null): number | null => {
    if (value == null) return null;
    return Math.trunc(Number(value));
  },
};

/** Нормализует опыт: text/строка JSON → массив (legacy и jsonb). */
const workExperienceTransformer = {
  to: (value: ResumeWorkExperienceEntry[] | null | undefined) =>
    value === undefined ? null : value,
  from: (
    value: string | ResumeWorkExperienceEntry[] | null | undefined,
  ): ResumeWorkExperienceEntry[] | null => {
    if (value == null) return null;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      const t = value.trim();
      if (!t) return null;
      try {
        const parsed = JSON.parse(t) as unknown;
        return Array.isArray(parsed)
          ? (parsed as ResumeWorkExperienceEntry[])
          : null;
      } catch {
        return null;
      }
    }
    return null;
  },
};

@Entity('resumes')
export class ResumeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => UserEntity, (user) => user.resumes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToMany(() => ApplicationEntity, (application) => application.resume)
  applications: ApplicationEntity[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  position: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  work_schedule: string;

  @Column({ nullable: true })
  payment_period: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: resumeSalaryNetTransformer,
  })
  salary_net: number;

  @Column({ type: 'date', nullable: true })
  birth_date: Date;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  city: string;

  @Column({ type: 'text', nullable: true })
  education: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    transformer: workExperienceTransformer,
  })
  work_experience: ResumeWorkExperienceEntry[] | null;

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
