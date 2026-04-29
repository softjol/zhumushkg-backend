import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ApplicationStatus } from '../../database/entitis/application.entity';

export class UpdateApplicationStatusDto {
  @ApiProperty({
    enum: ApplicationStatus,
    example: ApplicationStatus.REVIEWING,
  })
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;
}
