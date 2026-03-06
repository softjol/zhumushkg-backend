import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('role')
export class RoleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  role!: string;

  @Column({ type: 'varchar' })
  description!: string;

  @OneToMany(() => UserEntity, (user) => user.role)
  user!: UserEntity[];
}
