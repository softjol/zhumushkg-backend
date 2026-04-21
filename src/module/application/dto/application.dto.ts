import { IsInt, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApplicationStatus } from 'src/module/database/entitis/application.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({ example: 12, description: 'ID вакансии' })
  @IsInt()
  @IsNotEmpty()
  vacancy_id: number;

  @ApiProperty({ example: 56, description: 'ID резюме кандидата' })
  @IsInt()
  @IsNotEmpty()
  resume_id: number;

  @ApiPropertyOptional({
    deprecated: true,
    example: 34,
    description:
      'DEPRECATED: candidate_id берётся из JWT (req.user.id). Поле игнорируется.',
  })
  @IsInt()
  @IsOptional()
  candidate_id?: number;

  @ApiPropertyOptional({
    deprecated: true,
    enum: ApplicationStatus,
    example: ApplicationStatus.NEW,
    description:
      'DEPRECATED: status задаётся сервером и при создании всегда NEW. Поле игнорируется.',
  })
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;
}
