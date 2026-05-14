import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Тело POST /conversations — работодатель (JWT) открывает диалог с кандидатом. */
export class CreateConversationDto {
  @ApiProperty({ example: 42, description: 'ID кандидата' })
  @IsInt()
  @IsPositive()
  candidateId: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'ID вакансии (необязательно)',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  vacancyId?: number;
}
