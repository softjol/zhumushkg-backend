import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LandingReviewEntity } from '../database/entitis/landing-review.entity';
import { CreateLandingReviewDto } from './dto/create-landing-review.dto';
import { UpdateLandingReviewDto } from './dto/update-landing-review.dto';

export type LandingReviewPublic = {
  id: number;
  display_name: string;
  text: string;
  rating: number;
  created_at: Date;
};

@Injectable()
export class LandingReviewService {
  constructor(
    @InjectRepository(LandingReviewEntity)
    private readonly repo: Repository<LandingReviewEntity>,
  ) {}

  toPublic(entity: LandingReviewEntity): LandingReviewPublic {
    const trimmed = entity.author_name?.trim();
    return {
      id: entity.id,
      display_name: trimmed && trimmed.length > 0 ? trimmed : 'Аноним',
      text: entity.text,
      rating: entity.rating,
      created_at: entity.created_at,
    };
  }

  async create(dto: CreateLandingReviewDto): Promise<LandingReviewPublic> {
    const nameTrim = dto.name?.trim();
    const row = this.repo.create({
      author_name: nameTrim && nameTrim.length > 0 ? nameTrim : null,
      text: dto.text.trim(),
      rating: dto.rating,
    });
    const saved = await this.repo.save(row);
    return this.toPublic(saved);
  }

  async findAllForLanding(): Promise<LandingReviewPublic[]> {
    const rows = await this.repo.find({
      order: { created_at: 'DESC' },
    });
    return rows.map((r) => this.toPublic(r));
  }

  async findOneById(id: number): Promise<LandingReviewPublic> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Отзыв #${id} не найден`);
    }
    return this.toPublic(row);
  }

  async updateById(
    id: number,
    dto: UpdateLandingReviewDto,
  ): Promise<LandingReviewPublic> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Отзыв #${id} не найден`);
    }

    const hasName = dto.name !== undefined;
    const hasText = dto.text !== undefined;
    const hasRating = dto.rating !== undefined;
    if (!hasName && !hasText && !hasRating) {
      throw new BadRequestException('Укажите хотя бы одно поле для обновления');
    }

    if (hasName) {
      const t = dto.name?.trim();
      row.author_name = t && t.length > 0 ? t : null;
    }
    if (hasText) {
      row.text = dto.text!.trim();
    }
    if (hasRating) {
      row.rating = dto.rating!;
    }

    return this.toPublic(await this.repo.save(row));
  }

  async removeById(id: number): Promise<void> {
    const res = await this.repo.delete({ id });
    if (!res.affected) {
      throw new NotFoundException(`Отзыв #${id} не найден`);
    }
  }
}
