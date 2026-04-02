import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RoleEntity } from './role.entity';
import { EmailVerificationEntity } from './emailVerif.entity';
import { ResumeEntity } from './resume.entity';
import { ApplicationEntity } from './Application.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  fullName!: string;

  @Column({ type: 'varchar', nullable: true })
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  phoneNumber!: string;

  @Column({ type: 'boolean', default: false })
  phoneConfirmed!: boolean;

  @Column({ type: 'varchar', nullable: true })
  smsCode!: string | null;

  @Column({ type: 'varchar' })
  password!: string;

  @ManyToOne(() => RoleEntity, (role) => role.user)
  role!: RoleEntity;

  @OneToMany(() => ResumeEntity, (resume) => resume.user)
  resumes!: ResumeEntity[];

  @OneToMany(() => ApplicationEntity, (application) => application.candidate)
  applications: ApplicationEntity[];

  @Column({ type: 'varchar', nullable: true })
  phoneConfirmationToken!: string | null;
}
