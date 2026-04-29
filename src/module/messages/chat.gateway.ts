import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { NotificationService } from '../notification/notificant.service';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { WsJwtGuard } from './ws-jwt.guard';

// Карта для хранения сокетов пользователей — пока временная, лучше редис на дальнейшем этапе согласования
const userSockets = new Map<number, Set<string>>();

@UseGuards(WsJwtGuard)
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
  ) {}

  // WsJwtGuard уже записал userId и role в client.data до handleConnection
  async handleConnection(client: Socket) {
    const userId = client.data.userId as number;
    const role = client.data.role as string;

    if (!userId) {
      this.logger.warn(
        `[WARN] WS connection rejected — no userId, socketId=${client.id}`,
        client.id,
      );
      client.disconnect();
      return;
    }

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(client.id);

    this.logger.debug(
      `[SUCCESS] User connected: userId=${userId}, role=${role}, socketId=${client.id}`,
      client.id,
    );
  }

  // Отключение клиента и удаление из временного массива userSockets
  handleDisconnect(client: Socket) {
    const userId = client.data.userId as number;

    if (userId) {
      userSockets.get(userId)?.delete(client.id);
      if (userSockets.get(userId)?.size === 0) {
        userSockets.delete(userId);
      }
      this.logger.debug(
        `[SUCCESS] User disconnected: userId=${userId}, socketId=${client.id}`,
        client.id,
      );
    }
  }

  @SubscribeMessage('chat:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: number },
  ) {
    const userId: number = client.data.userId;
    const refId = client.id;
    this.logger.debug(
      `[GATEWAY] chat:join userId=${userId}, chatId=${payload.chatId}`,
      refId,
    );

    try {
      await this.chatService.getChatById(payload.chatId, userId, refId);
      client.join(`chat_${payload.chatId}`);
      await this.chatService.markAsRead(payload.chatId, userId, refId);

      client.to(`chat_${payload.chatId}`).emit('chat:user_joined', {
        chatId: payload.chatId,
        byUserId: userId,
      });

      this.logger.debug(
        `[SUCCESS] chat:join userId=${userId}, chatId=${payload.chatId}`,
        refId,
      );

      return { event: 'chat:joined', data: { chatId: payload.chatId } };
    } catch (error) {
      this.logger.error(
        `[ERROR] chat:join userId=${userId}, chatId=${payload.chatId}: ${JSON.stringify(error)}`,
        refId,
      );
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new WsException('Failed to join chat: ' + errorMessage);
    }
  }

  // Покинуть чат, удалить из комнаты и уведомить участников
  @SubscribeMessage('chat:leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: number },
  ) {
    const userId: number = client.data.userId;
    client.leave(`chat_${payload.chatId}`);
    this.logger.debug(
      `[SUCCESS] chat:leave userId=${userId}, chatId=${payload.chatId}`,
      client.id,
    );
    return { event: 'chat:left', data: { chatId: payload.chatId } };
  }

  @SubscribeMessage('chat:send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: number; content: string },
  ) {
    const userId: number = client.data.userId;
    const refId = client.id;
    this.logger.debug(
      `[GATEWAY] chat:send_message userId=${userId}, chatId=${payload.chatId}`,
      refId,
    );

    try {
      const message = await this.chatService.sendMessage(
        Number(payload.chatId),
        userId,
        payload.content,
        refId,
      );

      this.server.to(`chat_${payload.chatId}`).emit('chat:new_message', {
        chatId: payload.chatId,
        message,
      });

      const chat = await this.chatService.getChatById(
        Number(payload.chatId),
        userId,
        refId,
      );
      const recipientId =
        chat.hr_id === userId ? chat.candidate_id : chat.hr_id;

      // Проверяем, онлайн ли получатель в этой комнате
      const room = this.server.sockets.adapter.rooms.get(
        `chat_${payload.chatId}`,
      );
      const sockets = userSockets.get(recipientId);
      const isInRoom = [...(sockets ?? [])].some((sid) => room?.has(sid));

      if (!isInRoom) {
        // WS-уведомление если онлайн, но не в комнате
        this.notifyIfNotInRoom(recipientId, Number(payload.chatId), message);

        // SSE-уведомление — сохранит в БД и отправит через stream
        await this.notificationService.sendNotification(
          recipientId,
          'Новое сообщение',
          message.content.length > 50
            ? message.content.slice(0, 50) + '...'
            : message.content,
          'ws-chat',
        );
      }

      this.logger.debug(
        `[SUCCESS] chat:send_message userId=${userId}, chatId=${payload.chatId}, messageId=${message.id}`,
        refId,
      );

      return { event: 'chat:message_sent', messageId: message.id };
    } catch (error) {
      this.logger.error(
        `[ERROR] chat:send_message userId=${userId}, chatId=${payload.chatId}: ${JSON.stringify(error)}`,
        refId,
      );
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new WsException(errorMessage);
    }
  }

  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: number; isTyping: boolean },
  ) {
    client.to(`chat_${payload.chatId}`).emit('chat:typing', {
      chatId: payload.chatId,
      userId: client.data.userId,
      isTyping: payload.isTyping,
    });
  }

  @SubscribeMessage('chat:mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: number },
  ) {
    const userId: number = client.data.userId;
    const refId = client.id;
    this.logger.debug(
      `[GATEWAY] chat:mark_read userId=${userId}, chatId=${payload.chatId}`,
      refId,
    );

    try {
      await this.chatService.markAsRead(Number(payload.chatId), userId, refId);

      client.to(`chat_${payload.chatId}`).emit('chat:messages_read', {
        chatId: payload.chatId,
        byUserId: userId,
      });

      this.logger.debug(
        `[SUCCESS] chat:mark_read userId=${userId}, chatId=${payload.chatId}`,
        refId,
      );
    } catch (error) {
      this.logger.error(
        `[ERROR] chat:mark_read userId=${userId}, chatId=${payload.chatId}: ${JSON.stringify(error)}`,
        refId,
      );
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new WsException(errorMessage);
    }
  }

  notifyNewChat(recipientId: number, chat: any) {
    this.emitToUser(recipientId, 'chat:new_chat', { chat });
  }

  private emitToUser(userId: number, event: string, data: any) {
    const sockets = userSockets.get(userId);
    if (!sockets) return;
    sockets.forEach((socketId) => {
      this.server.to(socketId).emit(event, data);
    });
  }

  private notifyIfNotInRoom(recipientId: number, chatId: number, message: any) {
    this.emitToUser(recipientId, 'chat:notification', { chatId, message });
  }
}
