import { Module } from '@nestjs/common';
import { NikitaService } from './nikita.service';

@Module({
  providers: [NikitaService],
  exports: [NikitaService],
})
export class NikitaModule {}
