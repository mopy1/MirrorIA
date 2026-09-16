import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromocionesController } from './controller/promociones.controller.js';
import { Cupon } from './entities/cupon.entity.js';
import { PromocionesService } from './service/promociones.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Cupon])],
  controllers: [PromocionesController],
  providers: [PromocionesService],
  exports: [PromocionesService],
})
export class PromocionesModule {}
