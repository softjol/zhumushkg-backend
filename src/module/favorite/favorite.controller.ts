import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FavoriteService } from './favorite.service';
import { RefId } from 'src/decorators/ref.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { Request } from 'express';

@ApiTags('Избранное')
@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Добавить вакансию в избранное (JWT)' })
  @Post()
  async add(
    @Body() dto: CreateFavoriteDto,
    @RefId() refId: string,
    @Req() req: Request & { user?: any },
  ) {
    const userId = Number(req.user?.id);
    return await this.favoriteService.addToFavorites(
      userId,
      dto.vacancy_id,
      refId,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Убрать из избранного по id избранного (JWT)' })
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @RefId() refId: string,
    @Req() req: Request & { user?: any },
  ) {
    const userId = Number(req.user?.id);
    return await this.favoriteService.removeFromFavorites(userId, id, refId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Мои избранные вакансии (JWT)' })
  @Get()
  async myFavorites(
    @RefId() refId: string,
    @Req() req: Request & { user?: any },
  ) {
    const userId = Number(req.user?.id);
    return await this.favoriteService.getMyFavorites(userId, refId);
  }
}
