import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandingReviewEntity } from '../database/entitis/landing-review.entity';
import { LandingReviewService } from './landing-review.service';
import { LandingReviewController } from './landing-review.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([LandingReviewEntity]), AuthModule],
  controllers: [LandingReviewController],
  providers: [LandingReviewService],
})
export class LandingReviewModule {}