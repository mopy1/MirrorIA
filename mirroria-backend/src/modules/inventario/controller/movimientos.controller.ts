import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import type { MovimientoInventarioResponseDto } from '../dto/inventario-response.dto.js';
import { MovimientosInventarioService } from '../service/movimientos-inventario.service.js';

// Historial interno (auditoría de stock) — no es dato de cliente.
@ApiTags('inventario/movimientos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ENCARGADO_SUCURSAL')
@Controller('inventario/movimientos')
export class MovimientosController {
  constructor(private readonly movimientosService: MovimientosInventarioService) {}

  @Get()
  findAll(
    @Query('varianteId') varianteId?: string,
    @Query('sucursalId') sucursalId?: string,
  ): Promise<MovimientoInventarioResponseDto[]> {
    return this.movimientosService.findAll({ varianteId, sucursalId });
  }
}
