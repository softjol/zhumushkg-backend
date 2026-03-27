import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';
import { ApplicationStatus } from '../../database/entitis/application.entity';

export class CreateApplicationDto {
  @ApiProperty({
    description: 'ID соискателя',
    example: 1,
  })
  @IsNumber()
  applicantId: number;

  @ApiProperty({
    description: 'ID вакансии',
    example: 1,
  })
  @IsNumber()
  vacancyId: number;
}

export class UpdateApplicationStatusDto {
  @ApiProperty({
    description: 'Статус отклика',
    example: ApplicationStatus.ACCEPTED,
    enum: ApplicationStatus,
  })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}
