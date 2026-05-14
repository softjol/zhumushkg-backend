import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Частичное обновление: передайте хотя бы одно поле. */
export class UpdateLandingReviewDto {
  @ApiPropertyOptional({
    example: 'Мария',
    description: 'Имя; пустая строка — сохранить как аноним (null)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Обновлённый текст отзыва' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  text?: string;

  @ApiPropertyOptional({ example: 4, description: 'Оценка 1–5' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
