import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentasModule } from '../ventas/ventas.module.js';
import { PagosController } from './controller/pagos.controller.js';
import { WayraController } from './controller/wayra.controller.js';
import { Pago } from './entities/pago.entity.js';
import { ExpiracionService } from './service/expiracion.service.js';
import { PagosService } from './service/pagos.service.js';
import { PASARELA } from './service/pasarela/pasarela.interface.js';
import { PasarelaStripe } from './service/pasarela/stripe.pasarela.js';
import { CobroQrService } from './service/qr/cobro-qr.service.js';
import { WayraBancoService } from './service/wayra/wayra-banco.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Pago]), VentasModule],
  controllers: [PagosController, WayraController],
  providers: [
    PagosService,
    ExpiracionService,
    CobroQrService,
    WayraBancoService,
    { provide: PASARELA, useClass: PasarelaStripe },
  ],
})
export class PagosModule {}
