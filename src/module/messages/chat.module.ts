import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatEntity, MessageEntity } from '../database/entitis/chat.entity';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ConversationsController } from './conversations.controller';
import { MessagesController } from './messages.controller';
import { NotificationModule } from '../notification/notificant.module';
import { CustomLogger } from '../../helpers/logger/logger.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatEntity, MessageEntity]),
    NotificationModule,
    AuthModule,
  ],
  providers: [ChatService, ChatGateway, CustomLogger],
  controllers: [ConversationsController, MessagesController],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
