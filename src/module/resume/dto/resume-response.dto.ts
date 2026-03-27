import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';
import { ResumeResponseStatus } from '../../database/entitis/resume-response.entity';

export class CreateResumeResponseDto {
  @ApiProperty({
    description: 'ID работодателя',
    example: 1,
  })
  @IsNumber()
  employerId: number;
}

export class UpdateResumeResponseStatusDto {
  @ApiProperty({
    description: 'Статус отклика',
    example: ResumeResponseStatus.ACCEPTED,
    enum: ResumeResponseStatus,
  })
  @IsEnum(ResumeResponseStatus)
  status: ResumeResponseStatus;
}
