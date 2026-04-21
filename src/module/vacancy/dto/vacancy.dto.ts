import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateVacancyDto {
  @ApiProperty({ example: 'Разработка', description: 'Профессия' })
  @IsString()
  profession: string;

  @ApiProperty({
    example: 'Middle Node.js Developer',
    description: 'Должность',
  })
  @IsString()
  position: string;

  @ApiProperty({ example: 'Полный день', description: 'График работы' })
  @IsString()
  work_schedule: string;

  @ApiProperty({
    example: 'Разработка API, код-ревью...',
    description: 'Требования и обязанности',
  })
  @IsString()
  requir_respons: string;

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
}
