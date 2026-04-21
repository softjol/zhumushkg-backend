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
  firstName!: string;

  @ApiProperty({
    example: '+996700123456',
    description: 'Номер телефона',
  })
  @IsString()
  phoneNumber!: string;
}
