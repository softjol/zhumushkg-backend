import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RoleEntity } from './role.entity';
import { ResumeEntity } from './resume.entity';
import { ApplicationEntity } from './application.entity';
import { VacancyEntity } from './vacancy.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  firstName!: string;

  @Column({ type: 'varchar', nullable: true })
  phoneNumber!: string;

  @Column({ type: 'boolean', default: false })
  phoneConfirmed!: boolean;

  @Column({ type: 'varchar', nullable: true })
  smsCode!: string | null;

  @Column({ name: 'is_banned', type: 'boolean', default: false })
  isBanned!: boolean;

  @ManyToOne(() => RoleEntity, (role) => role.user)
  role!: RoleEntity;

  @OneToMany(() => ResumeEntity, (resume) => resume.user)
  resumes!: ResumeEntity[];

  @OneToMany(() => VacancyEntity, (vacancy) => vacancy.user)
  vacancies!: VacancyEntity[];

  @OneToMany(() => ApplicationEntity, (application) => application.candidate)
  applications: ApplicationEntity[];
}
