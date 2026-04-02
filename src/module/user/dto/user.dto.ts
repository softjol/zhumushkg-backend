import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsOptional } from 'class-validator';

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
    example: '+996700123456',
    description: 'Номер телефона',
  })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({
    example: 'strongPassword123',
    description: 'Пароль пользователя',
    minLength: 6,
  })
  @IsString()
  @Length(6, 255)
  password!: string;

  @ApiProperty({
    example: 'strongPassword123',
    description: 'Подтверждение пароля',
    minLength: 6,
  })
  @IsString()
  @Length(6, 255)
  confirm_password!: string;
}
