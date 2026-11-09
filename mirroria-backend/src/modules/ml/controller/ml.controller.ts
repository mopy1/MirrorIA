import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/security/current-user.decorator.js';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { FiltroDemandaDto } from '../dto/demanda-ml.dto.js';
import type { DemandaMlResponseDto } from '../dto/demanda-ml.dto.js';
import { FiltroNoShowDto } from '../dto/no-show-ml.dto.js';
import type { NoShowMlResponseDto } from '../dto/no-show-ml.dto.js';
import type { RfmMlResponseDto } from '../dto/rfm-ml.dto.js';
import type { AnomaliasMlResponseDto } from '../dto/anomalias-ml.dto.js';
import type { MetricasModelosMlResponseDto } from '../dto/metricas-ml.dto.js';
import { MlFallbackInterceptor } from '../interceptors/ml-fallback.interceptor.js';
import { MlService } from '../service/ml.service.js';

@ApiTags('ml')
@Controller('ml')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(MlFallbackInterceptor)
export class MlController {
  constructor(private readonly mlService: MlService) {}

  @Get('kpis/demanda')
  @ApiBearerAuth()
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  @ApiOperation({
    summary: 'M1: Proyección de Demanda de Prendas y Sugerencia de Reabastecimiento',
  })
  obtenerDemanda(
    @Query() filtro: FiltroDemandaDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<DemandaMlResponseDto> {
    return this.mlService.obtenerKpisDemanda(user, filtro);
  }

  @Get('kpis/no-show')
  @ApiBearerAuth()
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL', 'CAJERO')
  @ApiOperation({
    summary: 'M2: Evaluación Probabilística de No-Show en Reservas de Probador',
  })
  obtenerNoShow(
    @Query() filtro: FiltroNoShowDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<NoShowMlResponseDto> {
    return this.mlService.obtenerKpisNoShow(user, filtro);
  }

  @Get('kpis/no-show/agenda-hoy')
  @ApiBearerAuth()
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL', 'CAJERO')
  @ApiOperation({
    summary: 'M2: Agenda de Reservas de Hoy con Semáforo de Riesgo y Acción WhatsApp',
  })
  obtenerNoShowAgendaHoy(
    @Query() filtro: FiltroNoShowDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<NoShowMlResponseDto> {
    return this.mlService.obtenerKpisNoShow(user, filtro);
  }

  @Get('kpis/rfm')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'M3: Segmentación de Clientas por Matriz RFM (K-Means K=4)',
  })
  obtenerRfm(@CurrentUser() user: JwtPayload): Promise<RfmMlResponseDto> {
    return this.mlService.obtenerKpisRfm(user);
  }

  @Get('kpis/rfm/segmentos')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'M3: Clusters de Clientas RFM con Estrategias de Retención',
  })
  obtenerRfmSegmentos(@CurrentUser() user: JwtPayload): Promise<RfmMlResponseDto> {
    return this.mlService.obtenerKpisRfm(user);
  }

  @Get('kpis/anomalias')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'M4: Detección de Transacciones Anómalas en ventas y cobros (Isolation Forest)',
  })
  obtenerAnomalias(@CurrentUser() user: JwtPayload): Promise<AnomaliasMlResponseDto> {
    return this.mlService.obtenerKpisAnomalias(user);
  }

  @Get('kpis/anomalias/recientes')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'M4: Auditoría de Ventas Recientes Sospechosas',
  })
  obtenerAnomaliasRecientes(@CurrentUser() user: JwtPayload): Promise<AnomaliasMlResponseDto> {
    return this.mlService.obtenerKpisAnomalias(user);
  }

  @Get('modelos/metricas')
  @ApiBearerAuth()
  @Roles('ADMIN', 'ENCARGADO_SUCURSAL')
  @ApiOperation({
    summary: 'Ficha Científica de Métricas de Evaluación de los 4 Modelos (R2, AUC, F1, Silueta)',
  })
  obtenerMetricasModelos(): Promise<MetricasModelosMlResponseDto> {
    return this.mlService.obtenerMetricasModelos();
  }
}
