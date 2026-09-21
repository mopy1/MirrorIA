import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentasModule } from '../ventas/ventas.module.js';
import { PagosController } from './controller/pagos.controller.js';
import { Pago } from './entities/pago.entity.js';
import { PagosService } from './service/pagos.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Pago]), VentasModule],
  controllers: [PagosController],
  providers: [PagosService],
})
export class PagosModule {}
