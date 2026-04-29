import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AppUserRole } from '../../../common/constants/app-user-role';

export class SwitchRoleDto {
  @ApiProperty({
    enum: AppUserRole,
    example: AppUserRole.EMPLOYER,
    description:
      'Целевая роль: JOB_SEEKER (соискатель) или EMPLOYER (работодатель). Переключение только между этими двумя.',
  })
  @IsEnum(AppUserRole)
  role!: AppUserRole;
}
