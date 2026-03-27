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

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  fullName!: string;

  @Column({ type: 'varchar', nullable: true })
  email!: string;

  @Column({ type: 'boolean', default: false })
  emailConfirmed!: boolean;

  @Column({ type: 'varchar' })
  password!: string;

  @Column({ type: 'varchar', nullable: true })
  confirmPassword!: string;

  @Column({ type: 'varchar', nullable: true })
  phoneNumber!: string;

  @ManyToOne(() => RoleEntity, (role) => role.user)
  role!: RoleEntity;

  @OneToMany(() => ResumeEntity, (resume) => resume.user)
  resumes!: ResumeEntity[];

  @Column({ type: 'varchar', nullable: true })
  emailConfirmationToken!: string | null;

  @Column({ type: 'varchar', nullable: true })
  fcmToken!: string | null;
}
