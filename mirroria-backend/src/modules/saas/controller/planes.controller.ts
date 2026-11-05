import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PermitirTiendaNoDisponible } from '../../../core/tenancy/permitir-tienda-no-disponible.decorator.js';
import { SinTenant } from '../../../core/tenancy/sin-tenant.decorator.js';
import type { PlanDto } from '../dto/plan.dto.js';
import { PlanesService } from '../service/planes.service.js';

@ApiTags('saas/planes')
@SinTenant()
@PermitirTiendaNoDisponible()
@Controller('saas/planes')
export class PlanesController {
  constructor(private readonly planes: PlanesService) {}

  /** Planes ofrecidos en la landing (solo activos, por `orden`). */
  @Get()
  listar(): Promise<PlanDto[]> {
    return this.planes.listar(true);
  }
}
