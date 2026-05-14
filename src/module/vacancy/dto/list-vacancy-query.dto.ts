import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ListVacancyQueryDto {
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
      'Поиск по должности, описанию, компании, требованиям (подстрока, без учёта регистра)',
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

  @ApiPropertyOptional({ description: 'Фильтр по региону (подстрока)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  region?: string;

  @ApiPropertyOptional({ description: 'Фильтр по должности (подстрока)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  position?: string;

  @ApiPropertyOptional({ description: 'Фильтр по опыту работы (подстрока)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  experience_work?: string;

  @ApiPropertyOptional({ description: 'Фильтр по периоду оплаты (точно)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  payment_period?: string;

  @ApiPropertyOptional({ description: 'Минимальная зарплата' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsNumber()
  salary_from?: number;

  @ApiPropertyOptional({ description: 'Максимальная зарплата' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsNumber()
  salary_to?: number;

  @ApiPropertyOptional({ description: 'Удаленная работа (true/false)' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true';
  })
  @IsBoolean()
  remote_work?: boolean;

  @ApiPropertyOptional({ description: 'Фильтр по графику работы (точно)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  work_schedule?: string;
}
