import { IsInt, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApplicationStatus } from 'src/module/database/entitis/Application.entity';

export class CreateApplicationDto {
  @IsInt()
  @IsNotEmpty()
  vacancy_id: number;

  @IsInt()
  @IsNotEmpty()
  candidate_id: number;

  @IsInt()
  @IsNotEmpty()
  resume_id: number;

  @IsEnum(ApplicationStatus)
  @IsOptional() // Опционально, так как в базе есть дефолт 'NEW'
  status?: ApplicationStatus;
}
