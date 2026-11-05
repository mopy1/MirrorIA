import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { DataSource, Repository } from 'typeorm';
import type { DashboardPlataformaDto } from '../dto/dashboard-plataforma.dto.js';
import type { InquilinoResumenDto } from '../dto/inquilino.dto.js';
import { EstadoInquilino } from '../entities/inquilino.entity.js';
import { Plan } from '../entities/plan.entity.js';
import { EstadoSuscripcion, Suscripcion } from '../entities/suscripcion.entity.js';
import { MS_DIA } from '../saas-reglas.js';
import { EventosPlataformaService } from './eventos-plataforma.service.js';
import { InquilinosService } from './inquilinos.service.js';

const OFFSET_LA_PAZ_MS = 4 * 60 * 60 * 1000; // UTC-4 todo el año (sin horario de verano)

/** 'YYYY-MM' del instante en hora de La Paz. */
export function mesLaPaz(fecha: Date): string {
  return new Date(fecha.getTime() - OFFSET_LA_PAZ_MS).toISOString().slice(0, 7);
}

/** Los 12 meses que terminan en el de `ahora`, con ceros. */
export function altasPorMes(altas: Date[], ahora = new Date()): { mes: string; altas: number }[] {
  const lp = new Date(ahora.getTime() - OFFSET_LA_PAZ_MS);
  const meses = Array.from({ length: 12 }, (_, i) =>
    new Date(Date.UTC(lp.getUTCFullYear(), lp.getUTCMonth() - 11 + i, 1)).toISOString().slice(0, 7));
  const cuenta = new Map(meses.map((m) => [m, 0]));
  for (const f of altas) {
    const m = mesLaPaz(f);
    if (cuenta.has(m)) cuenta.set(m, cuenta.get(m)! + 1);
  }
  return meses.map((mes) => ({ mes, altas: cuenta.get(mes)! }));
}

/**
 * Churn 30 d. base = tiendas con una suscripción pagada (ACTIVA, o VENCIDA con referencia de
 * pago: la barrida pasa ACTIVA → VENCIDA) vigente hace 30 días; perdidas = de esas, las que hoy
 * no tienen nada vigente o están suspendidas.
 */
export function churn30d(
  subs: Suscripcion[], tiendas: InquilinoResumenDto[], ahora = Date.now(),
): { tasa: number; perdidas: number; base: number } {
  const t0 = ahora - 30 * MS_DIA;
  const pagada = (s: Suscripcion) =>
    s.estado === EstadoSuscripcion.ACTIVA || (s.estado === EstadoSuscripcion.VENCIDA && !!s.referenciaPago);
  const base = new Set(subs
    .filter((s) => pagada(s) && s.inicio.getTime() <= t0 && s.fin.getTime() >= t0)
    .map((s) => s.inquilino.id));
  const porId = new Map(tiendas.map((t) => [t.id, t]));
  const perdidas = [...base].filter((id) => {
    const t = porId.get(id);
    return !t || !t.disponible || t.estado === EstadoInquilino.SUSPENDIDO;
  }).length;
  return { tasa: base.size ? perdidas / base.size : 0, perdidas, base: base.size };
}

/** Altas de hace 14 a 90 días; convertidas = alguna suscripción con referencia de pago. */
export function conversionPrueba(
  subs: Suscripcion[], tiendas: InquilinoResumenDto[], ahora = Date.now(),
): { tasa: number; convertidas: number; cerradas: number } {
  const cerradas = tiendas.filter((t) => {
    const edad = ahora - Date.parse(t.createdAt);
    return edad >= 14 * MS_DIA && edad <= 90 * MS_DIA;
  });
  const pagaron = new Set(subs.filter((s) => s.referenciaPago).map((s) => s.inquilino.id));
  const convertidas = cerradas.filter((t) => pagaron.has(t.id)).length;
  return { tasa: cerradas.length ? convertidas / cerradas.length : 0, convertidas, cerradas: cerradas.length };
}

/** KPIs de la plataforma. Solo agregados: ninguna fila de negocio de una tienda. */
@Injectable()
export class DashboardPlataformaService {
  constructor(
    @InjectRepository(Suscripcion) private readonly suscripcionRepo: Repository<Suscripcion>,
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly inquilinos: InquilinosService,
    private readonly eventos: EventosPlataformaService,
  ) {}

  async dashboard(): Promise<DashboardPlataformaDto> {
    const [tiendas, subs, planes, gmv, actividad] = await Promise.all([
      this.inquilinos.listar(),
      this.suscripcionRepo.find({ relations: { inquilino: true } }),
      this.planRepo.find({ order: { orden: 'ASC' } }),
      this.gmv30d(),
      this.eventos.recientes(10),
    ]);
    const ahora = new Date();
    const serie = altasPorMes(tiendas.map((t) => new Date(t.createdAt)), ahora);
    const mrrCents = tiendas.reduce((total, t) => total + t.mrrCents, 0);
    const conMrr = tiendas.filter((t) => t.mrrCents > 0);
    return {
      tiendas: {
        total: tiendas.length,
        activas: tiendas.filter((t) => t.disponible).length,
        enPrueba: tiendas.filter((t) => t.suscripcion.estado === EstadoSuscripcion.TRIAL).length,
        vencidas: tiendas.filter((t) => t.suscripcion.estado === EstadoSuscripcion.VENCIDA).length,
        suspendidas: tiendas.filter((t) => t.estado === EstadoInquilino.SUSPENDIDO).length,
      },
      mrrCents,
      arrCents: mrrCents * 12,
      mrrPorPlan: planes
        .filter((p) => p.activo || conMrr.some((t) => t.plan.codigo === p.codigo))
        .map((p) => {
          const del = conMrr.filter((t) => t.plan.codigo === p.codigo);
          return { codigo: p.codigo, nombre: p.nombre, tiendas: del.length, mrrCents: del.reduce((s, t) => s + t.mrrCents, 0) };
        }),
      altasMes: serie[11].altas,
      altasMesAnterior: serie[10].altas,
      altasPorMes: serie,
      churn30d: churn30d(subs, tiendas, ahora.getTime()),
      conversionPrueba: conversionPrueba(subs, tiendas, ahora.getTime()),
      gmv30d: gmv,
      trialsPorVencer: tiendas
        .filter((t) => t.suscripcion.estado === EstadoSuscripcion.TRIAL && t.suscripcion.diasRestantes <= 7)
        .sort((a, b) => a.suscripcion.fin.localeCompare(b.suscripcion.fin)),
      actividad,
    };
  }

  /** sin-tenant: agregado global de la plataforma (un solo count/sum sobre todas las tiendas). */
  private async gmv30d(): Promise<{ ventas: number; montoCents: number }> {
    const desde = new Date(Date.now() - 30 * MS_DIA);
    const [f]: Array<{ n: number; monto: string }> = await this.dataSource.query(
      `SELECT count(*)::int AS n, coalesce(sum(total_cents), 0)::bigint AS monto
         FROM ventas WHERE estado IN ('PAGADA','ENTREGADA') AND "createdAt" >= $1`, // sin-tenant: KPI global
      [desde],
    );
    return { ventas: f?.n ?? 0, montoCents: Number(f?.monto ?? 0) };
  }
}

