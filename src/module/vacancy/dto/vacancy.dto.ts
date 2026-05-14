import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateVacancyDto {
  @ApiProperty({
    example: 1,
    required: false,
    description: 'ID пользователя, создавшего вакансию',
  })
  @IsNumber()
  @IsOptional()
  user_id?: number;

  @ApiProperty({
    example: 'Middle Node.js Developer',
    description: 'Должность',
  })
  @IsString()
  position: string;

  @ApiPropertyOptional({
    example: 'IT',
    description: 'Категория вакансии',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'Полный день', description: 'График работы' })
  @IsString()
  work_schedule: string;

  @ApiProperty({
    example: 'Знание Node.js, TypeScript...',
    description: 'Требования',
  })
  @IsString()
  requirements: string;

  @ApiProperty({
    example: 'Официальное оформление, ДМС...',
    description: 'Условия',
  })
  @IsString()
  conditions: string;

  @ApiProperty({
    example: 'Разработка backend-сервисов...',
    description: 'Описание вакансии',
  })
  @IsString()
  description: string;

  @ApiProperty({ example: '3-5 лет', description: 'Опыт работы' })
  @IsString()
  experience_work: string;

  @ApiPropertyOptional({
    example: true,
    default: false,
    description: 'Удаленная работа',
  })
  @IsBoolean()
  @IsOptional()
  remote_work?: boolean;

  @ApiProperty({ example: 'Москва', description: 'Город' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'ул. Ленина, д. 10', description: 'Адрес работы' })
  @IsString()
  work_address: string;

  @ApiProperty({ example: 'Московская область', description: 'Регион' })
  @IsString()
  region: string;

  @ApiProperty({
    example: 'Месяц',
    description: 'Период оплаты (напр. в месяц)',
  })
  @IsString()
  payment_period: string;

  @ApiProperty({ example: 150000, description: 'Зарплата на руки' })
  @IsNumber()
  salary_net: number;

  @ApiProperty({ example: 5, description: 'ID компании из справочника' })
  @IsString()
  company: string;

  @ApiPropertyOptional({
    example: 'Мы продуктовая компания, развиваем HR платформу.',
    description: 'Описание компании',
  })
  @IsString()
  @IsOptional()
  company_description?: string;
}
