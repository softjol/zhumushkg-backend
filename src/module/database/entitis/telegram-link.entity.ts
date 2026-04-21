import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('telegram_link')
export class TelegramLinkEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true })
  phoneNumber!: string;

  @Column({ type: 'varchar' })
  chatId!: string;
}
