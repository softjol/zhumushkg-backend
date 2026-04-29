import { IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationParamDto {
  @ApiProperty({ example: 1, description: 'ID уведомления' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id: number;
}
