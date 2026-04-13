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
import { CustomLogger } from '../../helpers/logger/logger.service';

@ApiTags('Chats')
@Controller('chats')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
  ) {}

  @Post('from-resume')
  @ApiOperation({ summary: 'HR открывает чат с кандидатом через резюме' })
  async openFromResume(@Body() dto: OpenChatFromResumeDto, refId: string) {
    this.logger.debug(
      `[CONTROLLER] openFromResume hrId=${dto.hrId}, candidateId=${dto.candidateId}`,
      refId,
    );

    try {
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

      this.logger.debug(
        `[SUCCESS] openFromResume chatId=${chat.id}, candidateId=${chat.candidate_id}`,
        refId,
      );

      return chat;
    } catch (error) {
      this.logger.error(
        `[ERROR] openFromResume hrId=${dto.hrId}, candidateId=${dto.candidateId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Get('my')
  @ApiOperation({ summary: 'Получить все чаты пользователя' })
  async getMyChats(@Query() query: GetMyChatsQueryDto, refId: string) {
    this.logger.debug(`[CONTROLLER] getMyChats userId=${query.userId}`, refId);

    try {
      const chats = await this.chatService.getUserChats(query.userId);
      this.logger.debug(
        `[SUCCESS] getMyChats userId=${query.userId}, count=${chats.length}`,
        refId,
      );
      return chats;
    } catch (error) {
      this.logger.error(
        `[ERROR] getMyChats userId=${query.userId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Получить сообщения чата с пагинацией' })
  @ApiParam({ name: 'id', description: 'ID чата' })
  async getMessages(
    @Param('id', ParseIntPipe) chatId: number,
    @Query() query: GetMessagesQueryDto,
    refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] getMessages chatId=${chatId}, userId=${query.userId}`,
      refId,
    );

    try {
      const messages = await this.chatService.getMessages(
        chatId,
        query.userId,
        query.limit,
        query.beforeId,
      );
      this.logger.debug(
        `[SUCCESS] getMessages chatId=${chatId}, userId=${query.userId}, count=${messages.length}`,
        refId,
      );
      return messages;
    } catch (error) {
      this.logger.error(
        `[ERROR] getMessages chatId=${chatId}, userId=${query.userId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить чат по ID' })
  @ApiParam({ name: 'id', description: 'ID чата' })
  async getChat(
    @Param('id', ParseIntPipe) chatId: number,
    @Query() query: GetChatQueryDto,
    refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] getChat chatId=${chatId}, userId=${query.userId}`,
      refId,
    );

    try {
      const chat = await this.chatService.getChatById(chatId, query.userId);
      this.logger.debug(
        `[SUCCESS] getChat chatId=${chatId}, userId=${query.userId}`,
        refId,
      );
      return chat;
    } catch (error) {
      this.logger.error(
        `[ERROR] getChat chatId=${chatId}, userId=${query.userId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }
}
