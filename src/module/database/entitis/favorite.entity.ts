import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { VacancyEntity } from './vacancy.entity';

@Entity('favorites')
@Unique('UQ_favorites_user_vacancy', ['user_id', 'vacancy_id'])
export class FavoriteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column()
  vacancy_id: number;

  @ManyToOne(() => VacancyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vacancy_id' })
  vacancy: VacancyEntity;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
