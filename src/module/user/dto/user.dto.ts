import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  Length,
  IsOptional,
  IsEmail,
  IsBoolean,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'Amirbek Amiraev',
    description: 'ФИО пользователя',
    maxLength: 255,
  })
  @IsString()
  @Length(1, 255)
  fullName!: string;

  @ApiProperty({
    example: 'amirbek@gmail.com',
    description: 'Email пользователя',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: false,
    description: 'Подтвержден ли email',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  emailConfirmed?: boolean;

  @ApiProperty({
    example: 'strongPassword123',
    description: 'Пароль пользователя',
    minLength: 6,
  })
  @IsString()
  @Length(6, 255)
  password!: string;

  @ApiProperty({
    example: '+996700123456',
    description: 'Номер телефона',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
