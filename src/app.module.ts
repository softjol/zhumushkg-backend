import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './module/database/database.module';
import { AuthModule } from './module/auth/auth.module';
import { UserModule } from './module/user/user.module';
import { RoleModule } from './module/role/role.module';
import { ResumeModule } from './module/resume/resume.module';
import { VacancyModule } from './module/vacancy/vacancy.module';
import { ApplicationModule } from './module/application/application.module';
import { TelegramModule } from './module/telegram/telegram.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    RoleModule,
    ResumeModule,
    VacancyModule,
    ApplicationModule,
    TelegramModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
