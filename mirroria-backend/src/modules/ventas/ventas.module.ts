import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoModule } from '../catalogo/catalogo.module.js';
import { InventarioModule } from '../inventario/inventario.module.js';
import { PromocionesModule } from '../promociones/promociones.module.js';
import { ReservasModule } from '../reservas/reservas.module.js';
import { SucursalesModule } from '../sucursales/sucursales.module.js';
import { CarritosController } from './controller/carritos.controller.js';
import { VentasController } from './controller/ventas.controller.js';
import { Carrito } from './entities/carrito.entity.js';
import { Venta } from './entities/venta.entity.js';
import { VentaItem } from './entities/venta-item.entity.js';
import { CarritosService } from './service/carritos.service.js';
import { VentasService } from './service/ventas.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Carrito, Venta, VentaItem]),
    CatalogoModule, // valida varianteId y lee precioCents
    SucursalesModule, // valida sucursalId
    InventarioModule, // descuenta stock al registrar una venta (RF20)
    ReservasModule, // completa la reserva si la venta la referencia (reservaId)
    PromocionesModule, // valida y descuenta cupones de descuento
  ],
  controllers: [CarritosController, VentasController],
  providers: [CarritosService, VentasService],
  exports: [VentasService],
})
export class VentasModule {}
