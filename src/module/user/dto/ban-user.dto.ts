import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class BanUserDto {
  @ApiProperty({
    example: true,
    description: 'true - заблокировать, false - разблокировать',
  })
  @IsBoolean()
  isBanned!: boolean;
}
