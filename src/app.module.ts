import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RefIdMiddleware } from './middleware/ref-id.middleware';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './module/database/database.module';
import { AuthModule } from './module/auth/auth.module';
import { UserModule } from './module/user/user.module';
import { RoleModule } from './module/role/role.module';
import { ResumeModule } from './module/resume/resume.module';
import { VacancyModule } from './module/vacancy/vacancy.module';
import { ApplicationModule } from './module/application/application.module';
import { FavoriteModule } from './module/favorite/favorite.module';
import { ChatModule } from './module/messages/chat.module';
import { LandingReviewModule } from './module/landing-review/landing-review.module';
import { WhatsappModule } from './module/whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UserModule,
    RoleModule,
    ResumeModule,
    VacancyModule,
    ApplicationModule,
    ChatModule,
    LandingReviewModule,
    WhatsappModule,
    FavoriteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RefIdMiddleware).forRoutes('*');
  }
}
