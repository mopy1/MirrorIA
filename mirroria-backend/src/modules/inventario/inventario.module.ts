import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoModule } from '../catalogo/catalogo.module.js';
import { ProveedoresModule } from '../proveedores/proveedores.module.js';
import { SucursalesModule } from '../sucursales/sucursales.module.js';
import { InventarioController } from './controller/inventario.controller.js';
import { MovimientosController } from './controller/movimientos.controller.js';
import { OrdenesCompraController } from './controller/ordenes-compra.controller.js';
import { InventarioSucursal } from './entities/inventario-sucursal.entity.js';
import { MovimientoInventario } from './entities/movimiento-inventario.entity.js';
import { OrdenCompra } from './entities/orden-compra.entity.js';
import { InventarioSucursalService } from './service/inventario-sucursal.service.js';
import { MovimientosInventarioService } from './service/movimientos-inventario.service.js';
import { OrdenesCompraService } from './service/ordenes-compra.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventarioSucursal, MovimientoInventario, OrdenCompra]),
    // Solo para validar varianteId/sucursalId/proveedorId vía sus services
    // exportados — inventario no importa las entidades de esos módulos.
    CatalogoModule,
    SucursalesModule,
    ProveedoresModule,
  ],
  controllers: [InventarioController, MovimientosController, OrdenesCompraController],
  providers: [InventarioSucursalService, MovimientosInventarioService, OrdenesCompraService],
  // Exportado para que ventas pueda descontar stock (ajustarStock) al
  // registrar una venta, sin importar la entidad InventarioSucursal.
  exports: [InventarioSucursalService],
})
export class InventarioModule {}
