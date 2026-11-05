import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaasModule } from '../saas/saas.module.js';
import { VentasModule } from '../ventas/ventas.module.js';
import { PagosController } from './controller/pagos.controller.js';
import { WayraController } from './controller/wayra.controller.js';
import { Pago } from './entities/pago.entity.js';
import { ExpiracionService } from './service/expiracion.service.js';
import { PagosService } from './service/pagos.service.js';
import { ManualPasarela } from './service/pasarela/manual.pasarela.js';
import { PASARELA } from './service/pasarela/pasarela.interface.js';
import { PaypalPasarela } from './service/pasarela/paypal.pasarela.js';
import { QrBancarioPasarela } from './service/pasarela/qr-bancario.pasarela.js';
import { RegistroPasarelasService } from './service/pasarela/registro-pasarelas.service.js';
import { PasarelaStripe } from './service/pasarela/stripe.pasarela.js';
import { WayraPasarela } from './service/pasarela/wayra.pasarela.js';
import { CobroQrService } from './service/qr/cobro-qr.service.js';
import { WayraBancoService } from './service/wayra/wayra-banco.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pago]),
    VentasModule,
    forwardRef(() => SaasModule),
  ],
  controllers: [PagosController, WayraController],
  providers: [
    PagosService,
    ExpiracionService,
    CobroQrService,
    WayraBancoService,
    PasarelaStripe,
    WayraPasarela,
    ManualPasarela,
    PaypalPasarela,
    QrBancarioPasarela,
    RegistroPasarelasService,
    { provide: PASARELA, useExisting: PasarelaStripe },
  ],
  exports: [
    RegistroPasarelasService,
    CobroQrService,
    PasarelaStripe,
    WayraPasarela,
    ManualPasarela,
    PaypalPasarela,
    QrBancarioPasarela,
    PASARELA,
  ],
})
export class PagosModule {}
