import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './module/database/database.module';
import { AuthModule } from './module/auth/auth.module';
import { UserModule } from './module/user/user.module';
import { RoleModule } from './module/role/role.module';
import { ResumeModule } from './module/resume/resume.module';

@Module({
  imports: [DatabaseModule, AuthModule, UserModule, RoleModule, ResumeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
