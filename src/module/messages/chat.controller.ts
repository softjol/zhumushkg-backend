import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
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
import { NotificationService } from '../notification/notificant.service';
import { OpenChatFromResumeDto } from './dto/open-chat-from-resume.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { RefId } from '../../decorators/ref.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Chats')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
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
  async openFromResume(
    @Body() dto: OpenChatFromResumeDto,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] openFromResume hrId=${user.id}, candidateId=${dto.candidateId}`,
      refId,
    );

    try {
      const chat = await this.chatService.openChatFromResume(
        user.id, // hrId из JWT
        dto.candidateId,
        refId, // ← refId на правильном месте
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
        `[ERROR] openFromResume hrId=${user.id}, candidateId=${dto.candidateId}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }

  @Get('my')
  @ApiOperation({ summary: 'Получить все чаты пользователя' })
  async getMyChats(
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(`[CONTROLLER] getMyChats userId=${user.id}`, refId);

    try {
      const chats = await this.chatService.getUserChats(user.id, refId);
      this.logger.debug(
        `[SUCCESS] getMyChats userId=${user.id}, count=${chats.length}`,
        refId,
      );
      return chats;
    } catch (error) {
      this.logger.error(
        `[ERROR] getMyChats userId=${user.id}: ${JSON.stringify(error)}`,
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
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] getMessages chatId=${chatId}, userId=${user.id}`,
      refId,
    );

    try {
      const messages = await this.chatService.getMessages(
        chatId,
        user.id,
        refId, // ← refId на правильном месте
        query.limit,
        query.beforeId,
      );
      this.logger.debug(
        `[SUCCESS] getMessages chatId=${chatId}, userId=${user.id}, count=${messages.length}`,
        refId,
      );
      return messages;
    } catch (error) {
      this.logger.error(
        `[ERROR] getMessages chatId=${chatId}, userId=${user.id}: ${JSON.stringify(error)}`,
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
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] getChat chatId=${chatId}, userId=${user.id}`,
      refId,
    );

    try {
      const chat = await this.chatService.getChatById(chatId, user.id, refId);
      this.logger.debug(
        `[SUCCESS] getChat chatId=${chatId}, userId=${user.id}`,
        refId,
      );
      return chat;
    } catch (error) {
      this.logger.error(
        `[ERROR] getChat chatId=${chatId}, userId=${user.id}: ${JSON.stringify(error)}`,
        refId,
      );
      throw error;
    }
  }
}
