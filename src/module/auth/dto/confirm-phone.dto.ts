import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConfirmPhoneDto {
  @ApiPropertyOptional({
    example: '7238',
    description: 'Один код из SMS (единственное поле для кода)',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    example: '+996777380432',
    description: 'Номер, указанный при регистрации',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  /** Старое имя поля; в Swagger скрыто. Не отправляйте вместе с code — достаточно одного кода. */
  @ApiHideProperty()
  @IsOptional()
  @IsString()
  smsCode?: string;
}
