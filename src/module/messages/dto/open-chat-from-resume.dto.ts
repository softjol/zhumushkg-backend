import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenChatFromResumeDto {
  @ApiProperty({ example: 1, description: 'ID HR-менеджера' })
  @IsInt()
  @IsPositive()
  hrId: number;

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
