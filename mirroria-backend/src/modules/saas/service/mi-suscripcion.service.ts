import { Injectable } from '@nestjs/common';
import type { MiSuscripcionDto } from '../dto/mi-suscripcion.dto.js';
import { EstadoSuscripcion } from '../entities/suscripcion.entity.js';
import { InquilinosService } from './inquilinos.service.js';
import { planADto } from './planes.service.js';
import { suscripcionADto, SuscripcionesService } from './suscripciones.service.js';
import { UsoPlanService } from './uso-plan.service.js';

/** Panel "Plan y suscripción" del ADMIN de una tienda. */
@Injectable()
export class MiSuscripcionService {
  constructor(
    private readonly inquilinos: InquilinosService,
    private readonly suscripciones: SuscripcionesService,
    private readonly usoPlan: UsoPlanService,
  ) {}

  async ver(tenantId: string): Promise<MiSuscripcionDto> {
    const [historial, uso, tienda] = await Promise.all([
      this.suscripciones.historial(tenantId),
      this.usoPlan.calcular(tenantId),
      this.inquilinos.detalle(tenantId),
    ]);
    const ultima = historial[0];
    const actual = suscripcionADto(ultima);
    return {
      tienda: { id: tienda.id, slug: tienda.slug, nombre: tienda.nombre, disponible: tienda.disponible },
      plan: planADto(ultima.plan),
      suscripcion: actual,
      uso,
      historial: historial.map(suscripcionADto),
      puedeCambiarPlan: actual.estado === EstadoSuscripcion.TRIAL,
      pagoDisponible: false,
    };
  }

  async cambiarPlan(tenantId: string, planCodigo: string): Promise<MiSuscripcionDto> {
    await this.suscripciones.cambiarPlan(tenantId, planCodigo, true);
    return this.ver(tenantId);
  }
}
