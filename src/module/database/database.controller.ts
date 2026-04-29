import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Database')
@Controller('database')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class DatabaseController {
  constructor() {}
}
