import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  DefaultValuePipe,
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
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendConversationMessageDto } from './dto/send-conversation-message.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { RefId } from '../../decorators/ref.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('conversations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Список диалогов текущего пользователя (с пагинацией и unread_count)',
  })
  async list(
    @CurrentUser() user: { id: number; role: string },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] GET /conversations userId=${user.id} page=${page} limit=${limit}`,
      refId,
    );
    return this.chatService.getUserChats(user.id, page, limit);
  }

  @Post()
  @ApiOperation({
    summary: 'Открыть или создать диалог (работодатель пишет кандидату)',
  })
  async create(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    this.logger.debug(
      `[CONTROLLER] POST /conversations hrId=${user.id}, candidateId=${dto.candidateId}`,
      refId,
    );

    const chat = await this.chatService.openChatFromResume(
      user.id,
      dto.candidateId,
      refId,
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

  @Get(':id/messages')
  @ApiOperation({ summary: 'Сообщения диалога (пагинация)' })
  @ApiParam({ name: 'id', description: 'ID диалога' })
  async getMessages(
    @Param('id', ParseIntPipe) conversationId: number,
    @Query() query: GetMessagesQueryDto,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    return this.chatService.getMessages(
      conversationId,
      user.id,
      refId,
      query.limit,
      query.beforeId,
    );
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Отправить сообщение в диалог' })
  @ApiParam({ name: 'id', description: 'ID диалога' })
  async sendMessage(
    @Param('id', ParseIntPipe) conversationId: number,
    @Body() dto: SendConversationMessageDto,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    const sent = await this.chatService.sendMessage(
      conversationId,
      user.id,
      dto.content,
      refId,
    );
    await this.chatGateway.dispatchOutgoingChatMessage(
      conversationId,
      sent.message,
      sent.recipientId,
      refId,
    );
    return sent.message;
  }

  @Get(':id/online')
  @ApiOperation({ summary: 'Онлайн статус собеседника в чате' })
  @ApiParam({ name: 'id', description: 'ID диалога' })
  async companionOnline(
    @Param('id', ParseIntPipe) conversationId: number,
    @CurrentUser() user: { id: number },
    @RefId() refId: string,
  ) {
    const chat = await this.chatService.getChatById(conversationId, user.id, refId);
    const companionId = chat.hr_id === user.id ? chat.candidate_id : chat.hr_id;
    const isOnline = this.chatGateway.isUserOnline(companionId);
    return { companionId, isOnline };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Диалог по ID (при открытии помечает входящие как прочитанные)',
  })
  @ApiParam({ name: 'id', description: 'ID диалога' })
  async getOne(
    @Param('id', ParseIntPipe) conversationId: number,
    @CurrentUser() user: { id: number; role: string },
    @RefId() refId: string,
  ) {
    const chat = await this.chatService.getChatById(
      conversationId,
      user.id,
      refId,
    );
    await this.chatService.markAsRead(conversationId, user.id, refId);
    return chat;
  }
}
