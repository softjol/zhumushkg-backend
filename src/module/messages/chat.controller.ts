import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { NotificationService } from '../notification/notificant.service';
import { OpenChatFromResumeDto } from './dto/open-chat-from-resume.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { GetChatQueryDto } from './dto/get-chat-query.dto';
import { GetMyChatsQueryDto } from './dto/get-my-chat-query.dto';

@ApiTags('Chats')
@Controller('chats')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly notificationService: NotificationService,
  ) {}

  @Post('from-resume')
  @ApiOperation({ summary: 'HR открывает чат с кандидатом через резюме' })
  async openFromResume(@Body() dto: OpenChatFromResumeDto) {
    const chat = await this.chatService.openChatFromResume(
      dto.hrId,
      dto.candidateId,
      dto.vacancyId,
    );
    this.chatGateway.notifyNewChat(chat.candidate_id, chat);
    await this.notificationService.sendNotification(
      chat.candidate_id,
      'HR хочет с вами пообщаться',
      'Откройте чат чтобы ответить',
      'http-chat',
    );
    return chat;
  }

  @Get('my')
  @ApiOperation({ summary: 'Получить все чаты пользователя' })
  async getMyChats(@Query() query: GetMyChatsQueryDto) {
    return this.chatService.getUserChats(query.userId);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Получить сообщения чата с пагинацией' })
  @ApiParam({ name: 'id', description: 'ID чата' })
  async getMessages(
    @Param('id', ParseIntPipe) chatId: number,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.chatService.getMessages(
      chatId,
      query.userId,
      query.limit,
      query.beforeId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить чат по ID' })
  @ApiParam({ name: 'id', description: 'ID чата' })
  async getChat(
    @Param('id', ParseIntPipe) chatId: number,
    @Query() query: GetChatQueryDto,
  ) {
    return this.chatService.getChatById(chatId, query.userId);
  }
}
