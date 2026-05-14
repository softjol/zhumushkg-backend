import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendConversationMessageDto {
  @ApiProperty({ example: 'Здравствуйте!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content: string;
}
