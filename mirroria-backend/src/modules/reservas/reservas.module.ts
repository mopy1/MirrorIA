import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoModule } from '../catalogo/catalogo.module.js';
import { InventarioModule } from '../inventario/inventario.module.js';
import { SucursalesModule } from '../sucursales/sucursales.module.js';
import { ReservasController } from './controller/reservas.controller.js';
import { ReservaItem } from './entities/reserva-item.entity.js';
import { Reserva } from './entities/reserva.entity.js';
import { ReservasService } from './service/reservas.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reserva, ReservaItem]),
    CatalogoModule, // valida varianteId
    SucursalesModule, // valida sucursalId
    InventarioModule, // ajustarReserva (cantidadReservada)
  ],
  controllers: [ReservasController],
  providers: [ReservasService],
  // Exportado para que ventas complete una reserva al registrar la venta
  // presencial que la concreta (ver VentasService.registrarPresencial).
  exports: [ReservasService],
})
export class ReservasModule {}
