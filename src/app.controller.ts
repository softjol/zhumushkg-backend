import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { JwtAuthGuard } from './module/auth/jwt-auth.guard';

@ApiTags('App')
@Controller()
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Проверка доступности API' })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
