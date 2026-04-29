import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  ValidateNested,
  ValidateIf,
} from 'class-validator';

export class WorkExperienceEntryDto {
  @ApiProperty({ example: 'ООО «Техно»', description: 'Компания' })
  @IsString()
  company: string;

  @ApiProperty({
    example: 'Backend-разработчик',
    description: 'Должность или профессия',
  })
  @IsString()
  position: string;

  @ApiProperty({ example: 3, description: 'Месяц начала работы (1–12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  start_month: number;

  @ApiProperty({ example: 2021, description: 'Год начала' })
  @IsInt()
  @Min(1970)
  @Max(2100)
  start_year: number;

  @ApiProperty({
    example: true,
    description: 'Работаю сейчас (если true — конец не обязателен)',
  })
  @IsBoolean()
  until_now: boolean;

  @ApiPropertyOptional({ example: 6, description: 'Месяц окончания (1–12)' })
  @ValidateIf((o: WorkExperienceEntryDto) => !o.until_now)
  @IsInt()
  @Min(1)
  @Max(12)
  end_month?: number;

  @ApiPropertyOptional({ example: 2024, description: 'Год окончания' })
  @ValidateIf((o: WorkExperienceEntryDto) => !o.until_now)
  @IsInt()
  @Min(1970)
  @Max(2100)
  end_year?: number;

  @ApiProperty({
    example: 'Разработка REST API, код-ревью.',
    description: 'Обязанности и достижения',
  })
  @IsString()
  description: string;
}

export class CreateResumeDto {
  @ApiProperty({
    example: 1,
    required: false,
    description:
      'ID пользователя (опционально). В production берётся из JWT и игнорируется, если передан.',
  })
  @IsNumber()
  @IsOptional()
  user_id?: number;

  @ApiProperty({ example: 'Опытный разработчик', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'Middle Node.js Developer',
    required: false,
    description: 'Желаемая должность (заголовок резюме)',
  })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({
    example: 'IT',
    required: false,
    description: 'Категория / сфера (для фильтра в каталоге)',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'Полный день', required: false })
  @IsString()
  @IsOptional()
  work_schedule?: string;

  @ApiProperty({ example: 'Ежемесячно', required: false })
  @IsString()
  @IsOptional()
  payment_period?: string;

  @ApiProperty({ example: 50000, required: false })
  @IsNumber()
  @IsOptional()
  salary_net?: number;

  @ApiProperty({ example: '1995-01-15', required: false })
  @IsDateString()
  @IsOptional()
  birth_date?: string;

  @ApiProperty({ example: '+996700000000', required: false })
  @IsString()
  @IsOptional()
  phone_number?: string;

  @ApiProperty({ example: 'Бишкек', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'Высшее, КГТУ', required: false })
  @IsString()
  @IsOptional()
  education?: string;

  @ApiProperty({
    type: [WorkExperienceEntryDto],
    required: false,
    description: 'Опыт работы: несколько мест (как в форме резюме)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkExperienceEntryDto)
  @IsOptional()
  work_experience?: WorkExperienceEntryDto[];

  @ApiProperty({ example: ['JavaScript', 'NestJS'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiProperty({ example: 'Ответственный, коммуникабельный', required: false })
  @IsString()
  @IsOptional()
  personal_qualities?: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg', required: false })
  @IsString()
  @IsOptional()
  photo?: string;
}
