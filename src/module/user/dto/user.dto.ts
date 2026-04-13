import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Column } from 'typeorm';

export class CreateUserDto {
  @ApiProperty({
    example: 'Amirbek',
    description: 'ФИО пользователя',
    maxLength: 255,
  })
  @Column({ nullable: true })
  firstName!: string;

  @ApiProperty({
    example: '+996777380432',
    description: 'Номер телефона',
  })
  @IsString()
  phoneNumber!: string;
}
