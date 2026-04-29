import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListResumeQueryDto {
  @ApiPropertyOptional({
    description: 'Фильтр по категории (точное совпадение)',
    example: 'IT',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  category?: string;

  @ApiPropertyOptional({
    description:
      'Поиск по должности, описанию, городу, образованию, личным качествам (подстрока)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ description: 'Фильтр по городу (подстрока)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  city?: string;

  @ApiPropertyOptional({ description: 'Желаемая должность (подстрока)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  position?: string;

  @ApiPropertyOptional({
    description:
      'Опыт работы (поиск по JSON опыта: компания, должность, описание)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  experience_work?: string;

  @ApiPropertyOptional({ description: 'Минимальная желаемая зарплата' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsNumber()
  salary_from?: number;

  @ApiPropertyOptional({ description: 'Максимальная желаемая зарплата' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsNumber()
  salary_to?: number;

  @ApiPropertyOptional({ description: 'График работы (точное совпадение)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  work_schedule?: string;
}
