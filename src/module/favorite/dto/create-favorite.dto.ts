import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({ example: 12, description: 'ID вакансии' })
  @IsInt()
  @IsNotEmpty()
  vacancy_id: number;
}
