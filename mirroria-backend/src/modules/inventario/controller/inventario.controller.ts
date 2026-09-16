import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { AjustarStockDto } from '../dto/ajustar-stock.dto.js';
import type { InventarioSucursalResponseDto } from '../dto/inventario-response.dto.js';
import { TipoMovimientoInventario } from '../entities/movimiento-inventario.entity.js';
import { InventarioSucursalService } from '../service/inventario-sucursal.service.js';

// GET queda público a propósito (RF08: el cliente consulta disponibilidad sin sesión).
@ApiTags('inventario')
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioSucursalService: InventarioSucursalService) {}

  @Get()
  findAll(
    @Query('varianteId') varianteId?: string,
    @Query('sucursalId') sucursalId?: string,
  ): Promise<InventarioSucursalResponseDto[]> {
    return this.inventarioSucursalService.findAll({ varianteId, sucursalId });
  }

  // Ajuste manual (mermas, conteos físicos, correcciones) — no pasa por
  // ventas ni ordenes_compra. tipoMovimiento siempre AJUSTE acá. ADMIN +
  // ENCARGADO_SUCURSAL (RF: "Registrar movimientos de inventario" es tarea
  // explícita del encargado, no solo del admin).
  @Post('ajustes')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  async ajustar(@Body() dto: AjustarStockDto): Promise<InventarioSucursalResponseDto> {
    const fila = await this.inventarioSucursalService.ajustarStock({
      varianteId: dto.varianteId,
      sucursalId: dto.sucursalId,
      cantidad: dto.cantidad,
      tipoMovimiento: TipoMovimientoInventario.AJUSTE,
      motivo: dto.motivo,
    });
    return {
      id: fila.id,
      varianteId: fila.varianteId,
      sucursalId: fila.sucursalId,
      cantidadDisponible: fila.cantidadDisponible,
      cantidadReservada: fila.cantidadReservada,
      cantidadEnTransito: fila.cantidadEnTransito,
    };
  }
}
