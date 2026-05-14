import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateLandingReviewDto {
  @ApiPropertyOptional({
    example: 'Айбек',
    description: 'Имя (необязательно; если не указано — «Аноним»)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({
    example: 'Удобный сервис, быстро нашёл работу.',
    description: 'Текст отзыва',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  text: string;

  @ApiProperty({ example: 5, description: 'Оценка от 1 до 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}
