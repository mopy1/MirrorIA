import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiudadesController } from './controller/ciudades.controller.js';
import { SucursalesController } from './controller/sucursales.controller.js';
import { Ciudad } from './entities/ciudad.entity.js';
import { Sucursal } from './entities/sucursal.entity.js';
import { CiudadesService } from './service/ciudades.service.js';
import { SucursalesService } from './service/sucursales.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Ciudad, Sucursal])],
  controllers: [CiudadesController, SucursalesController],
  providers: [CiudadesService, SucursalesService],
  // Exportado para que inventario/ventas puedan validar sucursalId sin
  // importar la entidad Sucursal directamente — mismo criterio que
  // ProveedoresService en proveedores/.
  exports: [SucursalesService],
})
export class SucursalesModule {}
