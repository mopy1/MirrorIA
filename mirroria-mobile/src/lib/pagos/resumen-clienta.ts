// KPIs del dashboard "Mis cosas" (M3.4). Puro: mismas fuentes que la web (`/ventas/mias`, `/reservas/mias`, cupo).
import { ventaPagada } from './estado-pago.ts';
import { reservaActiva } from '../reservas/comprar-reserva.ts';

interface VentaKpi {
  estado: string;
  totalCents: number;
  descuentoCents: number;
}
interface ReservaKpi {
  id: string;
  estado: string;
  fechaHoraPrevista: string;
}

export interface ResumenClienta<R extends ReservaKpi = ReservaKpi> {
  /** Compras pagadas (o entregadas). */
  compras: number;
  porPagar: number;
  gastadoCents: number;
  /** Ahorro con cupones, solo de lo pagado (lo cancelado no ahorró nada). */
  ahorroCents: number;
  reservasActivas: number;
  /** La próxima cita activa (la más cercana, aunque ya esté en tienda). */
  proxima: R | null;
}

export function resumenClienta<R extends ReservaKpi>(ventas: VentaKpi[], reservas: R[]): ResumenClienta<R> {
  const pagadas = ventas.filter((v) => ventaPagada(v.estado));
  const activas = reservas.filter((r) => reservaActiva(r.estado)).sort((a, b) => Date.parse(a.fechaHoraPrevista) - Date.parse(b.fechaHoraPrevista));
  return {
    compras: pagadas.length,
    porPagar: ventas.filter((v) => v.estado === 'PENDIENTE').length,
    gastadoCents: pagadas.reduce((s, v) => s + v.totalCents, 0),
    ahorroCents: pagadas.reduce((s, v) => s + v.descuentoCents, 0),
    reservasActivas: activas.length,
    proxima: activas[0] ?? null,
  };
}
