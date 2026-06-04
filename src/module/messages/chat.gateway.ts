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
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { ChatEntity, MessageEntity } from '../database/entitis/chat.entity';
import { NotificationService } from '../notification/notificant.service';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { WsJwtGuard } from './ws-jwt.guard';

// Карта для хранения сокетов пользователей — пока временная, лучше редис на дальнейшем этапе согласования
const userSockets = new Map<number, Set<string>>();

@UseGuards(WsJwtGuard)
@WebSocketGateway({
  cors: {
    // Функция — вычисляется при каждом запросе, env уже загружен
    origin: (
      origin: string | undefined,
      cb: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return cb(null, true); // curl, Postman, мобильные
      const allowed = (
        process.env.ALLOWED_ORIGINS ??
        'http://localhost:3000,https://zhumushkg-frontend-one.vercel.app,https://zhumushkg-frontend.vercel.app'
      )
        .split(',')
        .map((o) => o.trim());
      if (allowed.includes(origin)) return cb(null, true);
      cb(new Error(`WS CORS: origin ${origin} не разрешён`));
    },
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly notificationService: NotificationService,
    private readonly logger: CustomLogger,
    private readonly jwtService: JwtService,
  ) {}

  // Верифицируем JWT прямо здесь — @UseGuards не работает для handleConnection
  async handleConnection(client: Socket) {
    const authHeader = client.handshake.headers?.authorization;
    const fromHeader =
      typeof authHeader === 'string'
        ? authHeader.replace(/^Bearer\s+/i, '').trim()
        : undefined;
    const token = (client.handshake.auth?.token as string) || fromHeader;

    if (!token) {
      this.logger.warn(
        `[WARN] WS rejected — no token, socketId=${client.id}`,
        client.id,
      );
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<{
        id: number;
        role: string;
        isBanned?: boolean;
      }>(token, { secret: process.env.JWT_SECRET || 'SECRET_KEY' });

      if (payload.isBanned) {
        client.disconnect();
        return;
      }

      client.data.userId = payload.id;
      client.data.role = payload.role;
    } catch {
      this.logger.warn(
        `[WARN] WS rejected — invalid token, socketId=${client.id}`,
        client.id,
      );
      client.disconnect();
      return;
    }

    const userId = client.data.userId as number;
    const role = client.data.role as string;

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(client.id);

    this.logger.debug(
      `[SUCCESS] User connected: userId=${userId}, role=${role}, socketId=${client.id}`,
      client.id,
    );

    // Уведомляем всех — пользователь онлайн
    client.broadcast.emit('chat:user_online', { userId });
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

      // Уведомляем всех — пользователь офлайн (только если все вкладки закрыты)
      if (!this.isUserOnline(userId)) {
        client.broadcast.emit('chat:user_offline', { userId });
      }
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
      const { message, recipientId } = await this.chatService.sendMessage(
        Number(payload.chatId),
        userId,
        payload.content,
        refId,
      );

      await this.dispatchOutgoingChatMessage(
        Number(payload.chatId),
        message,
        recipientId,
        refId,
      );

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
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: number; isTyping: boolean },
  ) {
    const userId: number = client.data.userId;
    const refId = client.id;
    try {
      await this.chatService.getChatById(Number(payload.chatId), userId, refId);
    } catch {
      throw new WsException('Нет доступа к чату');
    }
    client.to(`chat_${payload.chatId}`).emit('chat:typing', {
      chatId: payload.chatId,
      userId,
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

  /** После сохранения сообщения (WS или HTTP): комната + уведомление получателю вне комнаты */
  async dispatchOutgoingChatMessage(
    chatId: number,
    message: MessageEntity,
    recipientId: number,
    refId: string,
  ): Promise<void> {
    if (this.server) {
      this.server.to(`chat_${chatId}`).emit('chat:new_message', {
        chatId,
        message,
      });
    }

    const adapter = this.server?.sockets?.adapter;
    const room = adapter?.rooms?.get(`chat_${chatId}`);
    const sockets = userSockets.get(recipientId);
    const isInRoom =
      room != null && [...(sockets ?? [])].some((sid) => room.has(sid));

    if (!isInRoom) {
      this.notifyIfNotInRoom(recipientId, chatId, message);
      await this.notificationService.sendNotification(
        recipientId,
        'Новое сообщение',
        this.previewText(message.content),
        'ws-chat',
      );
    }
  }

  notifyNewChat(recipientId: number, chat: ChatEntity) {
    this.emitToUser(recipientId, 'chat:new_chat', { chat });
  }

  /** Проверить онлайн статус пользователя */
  isUserOnline(userId: number): boolean {
    return (userSockets.get(userId)?.size ?? 0) > 0;
  }

  /** Получить список онлайн пользователей из массива id */
  getOnlineUsers(userIds: number[]): number[] {
    return userIds.filter((id) => this.isUserOnline(id));
  }

  private previewText(content: string, maxLen = 50): string {
    return content.length > maxLen ? `${content.slice(0, maxLen)}...` : content;
  }

  private emitToUser(userId: number, event: string, data: unknown) {
    if (!this.server) return;
    const sockets = userSockets.get(userId);
    if (!sockets) return;
    sockets.forEach((socketId) => {
      this.server.to(socketId).emit(event, data);
    });
  }

  private notifyIfNotInRoom(
    recipientId: number,
    chatId: number,
    message: MessageEntity,
  ) {
    this.emitToUser(recipientId, 'chat:notification', { chatId, message });
  }
}
