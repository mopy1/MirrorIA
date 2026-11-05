import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PermitirTiendaNoDisponible } from '../../../core/tenancy/permitir-tienda-no-disponible.decorator.js';
import { SinTenant } from '../../../core/tenancy/sin-tenant.decorator.js';
import type { EstadisticasPublicasDto } from '../dto/estadisticas-publicas.dto.js';
import { EstadisticasService } from '../service/estadisticas.service.js';

// Controller propio para no chocar con GET /saas/tiendas/:slug.
@ApiTags('saas/estadisticas')
@SinTenant()
@PermitirTiendaNoDisponible()
@Controller('saas/estadisticas')
export class EstadisticasController {
  constructor(private readonly estadisticas: EstadisticasService) {}

  /** Cifras vivas de la landing (caché 5 min). */
  @Get()
  ver(): Promise<EstadisticasPublicasDto> {
    return this.estadisticas.publicas();
  }
}
