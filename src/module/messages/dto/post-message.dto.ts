import { IsInt, IsNotEmpty, IsPositive, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Тело POST /messages — ID диалога = id из GET /conversations (сущность чата в БД). */
export class PostMessageDto {
  @ApiProperty({ example: 5, description: 'ID диалога (conversation)' })
  @IsInt()
  @IsPositive()
  conversationId: number;

  @ApiProperty({ example: 'Текст сообщения' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content: string;
}
