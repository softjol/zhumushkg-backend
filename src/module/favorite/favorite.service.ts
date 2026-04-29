import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteEntity } from '../database/entitis/favorite.entity';
import { VacancyEntity } from '../database/entitis/vacancy.entity';
import { CustomLogger } from 'src/helpers/logger/logger.service';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly favoriteRepository: Repository<FavoriteEntity>,
    @InjectRepository(VacancyEntity)
    private readonly vacancyRepository: Repository<VacancyEntity>,
    private readonly logger: CustomLogger,
  ) {}

  async addToFavorites(userId: number, vacancyId: number, refId: string) {
    this.logger.debug(
      `[SERVICE] add to favorites userId=${userId} vacancyId=${vacancyId}`,
      refId,
    );

    const vacancy = await this.vacancyRepository.findOne({
      where: { id: vacancyId },
    });
    if (!vacancy) {
      throw new NotFoundException(`Vacancy #${vacancyId} not found`);
    }

    const existing = await this.favoriteRepository.findOne({
      where: { user_id: userId, vacancy_id: vacancyId },
    });
    if (existing) {
      throw new ConflictException('Vacancy already in favorites');
    }

    const favorite = this.favoriteRepository.create({
      user_id: userId,
      vacancy_id: vacancyId,
    });
    return await this.favoriteRepository.save(favorite);
  }

  async removeFromFavorites(userId: number, favoriteId: number, refId: string) {
    this.logger.debug(
      `[SERVICE] remove favorite userId=${userId} favoriteId=${favoriteId}`,
      refId,
    );

    const favorite = await this.favoriteRepository.findOne({
      where: { id: favoriteId, user_id: userId },
    });
    if (!favorite) {
      throw new NotFoundException(`Favorite #${favoriteId} not found`);
    }

    await this.favoriteRepository.delete(favoriteId);
    return { message: 'Removed from favorites' };
  }

  async getMyFavorites(userId: number, refId: string) {
    this.logger.debug(`[SERVICE] get my favorites userId=${userId}`, refId);

    return await this.favoriteRepository.find({
      where: { user_id: userId },
      relations: ['vacancy'],
      order: { created_at: 'DESC' },
    });
  }
}
