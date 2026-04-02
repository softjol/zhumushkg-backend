import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginTelegramDto {
  @ApiProperty({
    example: '+996700123456',
    description: 'Номер телефона пользователя для входа через Telegram',
  })
  @IsString()
  phoneNumber!: string;
}

