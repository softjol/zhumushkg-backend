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

export class UserParamDto {
  @ApiProperty({
    example: 1,
    description: 'ID пользователя (временно, заменить на JWT)',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  userId: number;
}
