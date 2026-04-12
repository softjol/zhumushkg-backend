import { IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetChatQueryDto {
  @ApiProperty({
    example: 1,
    description: 'ID пользователя (временно, заменить на JWT)',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  userId: number;
}
