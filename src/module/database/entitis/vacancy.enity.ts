import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('vacancy')
export class VacancyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  profession: string;

  @Column()
  position: string;

  @Column({ name: 'work_schedule' })
  work_schedule: string;

  @Column({ name: 'requir_respons', type: 'text' })
  requir_respons: string;

  @Column({ name: 'experience_work' }) // Исправлено exprience
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

  @Column({ name: 'salary_net', type: 'decimal', precision: 10, scale: 2 })
  salary_net: number;

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  favorite: number;

  @Column({ default: 0 })
  offers: number;

  @Column()
  company: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
