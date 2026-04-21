import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: '+996700123456',
    description: 'Номер телефона пользователя',
  })
  @IsString()
  phoneNumber!: string;
}
