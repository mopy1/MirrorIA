import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/security/jwt-auth.guard.js';
import { Roles } from '../../../core/security/roles.decorator.js';
import { RolesGuard } from '../../../core/security/roles.guard.js';
import { PermitirTiendaNoDisponible } from '../../../core/tenancy/permitir-tienda-no-disponible.decorator.js';
import { tenantActual } from '../../../core/tenancy/tenant-context.js';
import { CambiarPlanDto } from '../dto/cambiar-plan.dto.js';
import type { MiSuscripcionDto } from '../dto/mi-suscripcion.dto.js';
import { MiSuscripcionService } from '../service/mi-suscripcion.service.js';

// El dueño de la tienda (ADMIN) ve su plan aunque la tienda esté vencida o suspendida.
@ApiTags('saas/mi-suscripcion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@PermitirTiendaNoDisponible()
@Controller('saas/mi-suscripcion')
export class MiSuscripcionController {
  constructor(private readonly miSuscripcion: MiSuscripcionService) {}

  @Get()
  ver(): Promise<MiSuscripcionDto> {
    return this.miSuscripcion.ver(tenantActual());
  }

  /** Solo en TRIAL (con cobro llega en la Fase 2). */
  @Patch('plan')
  cambiarPlan(@Body() dto: CambiarPlanDto): Promise<MiSuscripcionDto> {
    return this.miSuscripcion.cambiarPlan(tenantActual(), dto.planCodigo);
  }
}
