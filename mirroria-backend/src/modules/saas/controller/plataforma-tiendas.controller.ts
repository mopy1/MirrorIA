import { Body, Controller, DefaultValuePipe, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SolicitudInvalidaException } from '../../../core/exception/solicitud-invalida.exception.js';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { SinTenant } from '../../../core/tenancy/sin-tenant.decorator.js';
import type { DashboardPlataformaDto } from '../dto/dashboard-plataforma.dto.js';
import type { EventoPlataformaDto } from '../dto/evento-plataforma.dto.js';
import type { InquilinoDetalleDto } from '../dto/inquilino.dto.js';
import type { MetricasTiendaDto } from '../dto/metricas-tienda.dto.js';
import { RestablecerMarcaPlataformaDto } from '../dto/restablecer-marca-plataforma.dto.js';
import { DashboardPlataformaService } from '../service/dashboard-plataforma.service.js';
import { EventosPlataformaService } from '../service/eventos-plataforma.service.js';
import { InquilinosService } from '../service/inquilinos.service.js';
import { MetricasTiendaService } from '../service/metricas-tienda.service.js';

// Panel del DUENO_PLATAFORMA (Fase 1b): KPIs, métricas agregadas por tienda, bitácora y moderación de marca.
@ApiTags('saas/plataforma')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DUENO_PLATAFORMA')
@SinTenant()
@Controller('saas/plataforma')
export class PlataformaTiendasController {
  constructor(
    private readonly dashboard: DashboardPlataformaService,
    private readonly metricas: MetricasTiendaService,
    private readonly eventos: EventosPlataformaService,
    private readonly inquilinos: InquilinosService,
  ) {}

  @Get('dashboard')
  verDashboard(): Promise<DashboardPlataformaDto> {
    return this.dashboard.dashboard();
  }

  /** Solo agregados (conteos y sumas), nunca filas. 404 si la tienda no existe. */
  @Get('inquilinos/:id/metricas')
  async verMetricas(@Param('id') id: string): Promise<MetricasTiendaDto> {
    await this.inquilinos.buscar(id);
    return this.metricas.calcular(id);
  }

  @Get('actividad')
  actividad(@Query('limite', new DefaultValuePipe(20), ParseIntPipe) limite: number): Promise<EventoPlataformaDto[]> {
    if (limite < 1 || limite > 100) throw new SolicitudInvalidaException('limite: entre 1 y 100');
    return this.eventos.recientes(limite);
  }

  @Post('inquilinos/:id/marca/restablecer')
  @HttpCode(HttpStatus.OK)
  restablecerMarca(
    @Param('id') id: string, @Body() dto: RestablecerMarcaPlataformaDto, @CurrentUser() user: JwtPayload,
  ): Promise<InquilinoDetalleDto> {
    return this.inquilinos.restablecerMarca(id, dto, user.sub);
  }
}
