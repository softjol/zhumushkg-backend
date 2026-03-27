import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsDateString,
} from 'class-validator';

export class CreateResumeDto {
  @ApiProperty({ example: 1, description: 'ID пользователя' })
  @IsNumber()
  user_id: number;

  @ApiProperty({ example: 'Опытный разработчик', required: false })
  @IsString()
  @IsOptional()
  description?: string;

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

  @ApiProperty({ example: '3 года в ООО Tech', required: false })
  @IsString()
  @IsOptional()
  work_experience?: string;

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
