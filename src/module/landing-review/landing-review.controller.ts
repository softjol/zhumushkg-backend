import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { LandingReviewService } from './landing-review.service';
import { CreateLandingReviewDto } from './dto/create-landing-review.dto';
import { UpdateLandingReviewDto } from './dto/update-landing-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Отзыв')
@Controller('landing/reviews')
export class LandingReviewController {
  constructor(private readonly landingReviewService: LandingReviewService) {}

  private assertAdmin(req: Request & { user?: { role?: string } }) {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Только администратор может выполнять это действие',
      );
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Список отзывов для лендинга',
    description:
      'Публичный эндпоинт. Поле `display_name` — имя или «Аноним», если имя не указали.',
  })
  list() {
    return this.landingReviewService.findAllForLanding();
  }

  @Post()
  @ApiOperation({
    summary: 'Оставить отзыв с лендинга',
    description:
      'Публичный эндпоинт без JWT. Имя необязательно; текст и оценка 1–5 обязательны.',
  })
  create(@Body() dto: CreateLandingReviewDto) {
    return this.landingReviewService.create(dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('admin/:id')
  @ApiOperation({ summary: 'ADMIN: один отзыв по ID' })
  @ApiParam({ name: 'id', description: 'ID отзыва' })
  adminGetOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user?: { role?: string } },
  ) {
    this.assertAdmin(req);
    return this.landingReviewService.findOneById(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('admin/:id')
  @ApiOperation({ summary: 'ADMIN: изменить отзыв' })
  @ApiParam({ name: 'id', description: 'ID отзыва' })
  adminUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLandingReviewDto,
    @Req() req: Request & { user?: { role?: string } },
  ) {
    this.assertAdmin(req);
    return this.landingReviewService.updateById(id, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('admin/:id')
  @ApiOperation({ summary: 'ADMIN: удалить отзыв' })
  @ApiParam({ name: 'id', description: 'ID отзыва' })
  async adminRemove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user?: { role?: string } },
  ) {
    this.assertAdmin(req);
    await this.landingReviewService.removeById(id);
    return { ok: true, id };
  }
}
