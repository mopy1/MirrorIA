import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InteraccionIa } from './entities/interaccion-ia.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([InteraccionIa])],
})
export class IaModule {}
