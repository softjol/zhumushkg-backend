import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsOptional } from 'class-validator';
import { IsEnum } from 'class-validator';
import { AppUserRole } from '../../../common/constants/app-user-role';

export class CreateUserDto {
  @ApiProperty({
    example: 'Amirbek Amiraev',
    description: 'ФИО пользователя',
    maxLength: 255,
  })
  @IsString()
  @Length(1, 255)
  firstName!: string;

  @ApiProperty({
    example: '+996700123456',
    description: 'Номер телефона',
  })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({
    required: false,
    enum: AppUserRole,
    example: AppUserRole.JOB_SEEKER,
    description:
      'Роль при регистрации: JOB_SEEKER (соискатель) или EMPLOYER (работодатель). По умолчанию JOB_SEEKER.',
  })
  @IsOptional()
  @IsEnum(AppUserRole)
  role?: AppUserRole;
}
