import { ApiProperty } from '@nestjs/swagger';

export class RoleDto {
  @ApiProperty({
    description: 'Название роли',
    example: 'admin',
  })
  readonly role!: string;
  @ApiProperty({
    description: 'Описание роли',
    example: 'Пользователь с правами администратора',
  })
  readonly description!: string;
}
