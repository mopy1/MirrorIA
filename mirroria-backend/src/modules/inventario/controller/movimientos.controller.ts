import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { sucursalDelStaff } from '../../../core/security/sucursal-del-staff.js';
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
    @CurrentUser() user: JwtPayload,
    @Query('varianteId') varianteId?: string,
    @Query('sucursalId') sucursalId?: string,
  ): Promise<MovimientoInventarioResponseDto[]> {
    // Igual que GET /reservas: el encargado solo ve su sucursal (la del JWT manda).
    return this.movimientosService.findAll({
      varianteId,
      sucursalId: sucursalDelStaff(user) ?? sucursalId,
    });
  }
}
