import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/** Отзывы с лендинга (без привязки к аккаунту). */
@Entity('landing_reviews')
export class LandingReviewEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /** Имя автора; null/пусто → на фронте показывают «Аноним». */
  @Column({ type: 'varchar', length: 120, nullable: true })
  author_name: string | null;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'smallint' })
  rating: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;
}
