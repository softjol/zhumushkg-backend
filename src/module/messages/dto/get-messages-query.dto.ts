import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetMessagesQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'ID пользователя (временно, заменить на JWT)',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  userId: number;

  @ApiPropertyOptional({
    example: 30,
    default: 30,
    description: 'Сколько сообщений загрузить',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 30;

  @ApiPropertyOptional({
    example: 50,
    description: 'Пагинация — загрузить сообщения до этого ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  beforeId?: number;
}
