import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyTelegramDto {
  @ApiProperty({
    example: '+996700123456',
    description: 'Номер телефона пользователя',
  })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({
    example: '123456',
    description: 'Код подтверждения, полученный в Telegram',
  })
  @IsString()
  code!: string;
}

