import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PostMessageDto } from './dto/post-message.dto';
import { RefId } from '../../decorators/ref.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class EditMessageDto {
  @IsString()
  @MinLength(1)
  content: string;
}

@ApiTags('messages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Отправить сообщение (указать ID диалога в теле)' })
  async send(
    @Body() dto: PostMessageDto,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    const sent = await this.chatService.sendMessage(
      dto.conversationId,
      user.id,
      dto.content,
      refId,
    );
    await this.chatGateway.dispatchOutgoingChatMessage(
      dto.conversationId,
      sent.message,
      sent.recipientId,
      refId,
    );
    return sent.message;
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Отметить одно сообщение прочитанным' })
  @ApiParam({ name: 'id', description: 'ID сообщения' })
  async markRead(
    @Param('id', ParseIntPipe) messageId: number,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    return this.chatService.markMessageAsRead(messageId, user.id, refId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Редактировать своё сообщение (только непрочитанное)' })
  @ApiParam({ name: 'id', description: 'ID сообщения' })
  async edit(
    @Param('id', ParseIntPipe) messageId: number,
    @Body() dto: EditMessageDto,
    @CurrentUser() user: { id: number },
    @RefId() refId: string,
  ) {
    const updated = await this.chatService.editMessage(
      messageId,
      user.id,
      dto.content,
      refId,
    );
    // Уведомляем собеседника через WS
    this.chatGateway['server']
      ?.to(`chat_${updated.chat_id}`)
      .emit('chat:message_edited', { messageId: updated.id, content: updated.content });
    return updated;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить своё сообщение' })
  @ApiParam({ name: 'id', description: 'ID сообщения' })
  async remove(
    @Param('id', ParseIntPipe) messageId: number,
    @CurrentUser() user: { id: number },
    @RefId() refId: string,
  ) {
    // Нужно знать chat_id до удаления — для WS события
    const msg = await this.chatService['messageRepo'].findOne({
      where: { id: messageId },
    });
    await this.chatService.deleteMessage(messageId, user.id, refId);
    if (msg) {
      this.chatGateway['server']
        ?.to(`chat_${msg.chat_id}`)
        .emit('chat:message_deleted', { messageId });
    }
    return { success: true };
  }
}
