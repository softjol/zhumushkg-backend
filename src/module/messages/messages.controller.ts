import {
  Controller,
  Post,
  Patch,
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
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PostMessageDto } from './dto/post-message.dto';
import { RefId } from '../../decorators/ref.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
}
