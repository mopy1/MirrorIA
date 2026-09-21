import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentasModule } from '../ventas/ventas.module.js';
import { PagosController } from './controller/pagos.controller.js';
import { Pago } from './entities/pago.entity.js';
import { ExpiracionService } from './service/expiracion.service.js';
import { PagosService } from './service/pagos.service.js';
import { PASARELA } from './service/pasarela/pasarela.interface.js';
import { PasarelaStripe } from './service/pasarela/stripe.pasarela.js';

@Module({
  imports: [TypeOrmModule.forFeature([Pago]), VentasModule],
  controllers: [PagosController],
  providers: [
    PagosService,
    ExpiracionService,
    { provide: PASARELA, useClass: PasarelaStripe },
  ],
})
export class PagosModule {}
