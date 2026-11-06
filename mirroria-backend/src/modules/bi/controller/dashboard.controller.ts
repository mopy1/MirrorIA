import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { sucursalDelStaff } from '../../../core/security/sucursal-del-staff.js';
import { FiltroDashboardEjecutivoDto } from '../dto/filtro-dashboard-ejecutivo.dto.js';
import { FiltroDashboardOperativoDto } from '../dto/filtro-dashboard-operativo.dto.js';
import type { DashboardEjecutivoResponseDto } from '../dto/dashboard-ejecutivo.dto.js';
import type { DashboardOperativoResponseDto } from '../dto/dashboard-operativo.dto.js';
import { DashboardEjecutivoService } from '../service/dashboard-ejecutivo.service.js';
import { DashboardOperativoService } from '../service/dashboard-operativo.service.js';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly dashboardEjecutivoService: DashboardEjecutivoService,
    private readonly dashboardOperativoService: DashboardOperativoService,
  ) {}

  @Get('ejecutivo')
  @ApiBearerAuth()
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  @ApiOperation({
    summary: 'Dashboard Ejecutivo BI (Salud financiera, KPIs, gráficos y cuotas SaaS)',
  })
  obtenerEjecutivo(
    @Query() filtro: FiltroDashboardEjecutivoDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<DashboardEjecutivoResponseDto> {
    // Si el usuario es encargado de sucursal, acotar obligatoriamente a su sucursal
    if (user.role === 'ENCARGADO_SUCURSAL') {
      const propia = sucursalDelStaff(user);
      if (propia) {
        filtro.sucursalId = propia;
      }
    }
    return this.dashboardEjecutivoService.obtener(filtro);
  }

  @Get('operativo')
  @ApiBearerAuth()
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL', 'CAJERO')
  @ApiOperation({
    summary: 'Dashboard Operativo POS (Facturación hoy, pendientes, reservas del día y stock crítico)',
  })
  obtenerOperativo(
    @Query() filtro: FiltroDashboardOperativoDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<DashboardOperativoResponseDto> {
    return this.dashboardOperativoService.obtener(user, filtro);
  }
}
