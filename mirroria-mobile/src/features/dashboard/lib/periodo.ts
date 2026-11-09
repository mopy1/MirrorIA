import type { FiltroDashboardEjecutivo, PeriodoDashboard } from '../types/dashboard.types';

/** Mismos períodos y etiquetas que la barra de filtros de la web. */
export const PERIODOS: { id: PeriodoDashboard; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: '7d', label: '7 días' },
  { id: '30d', label: '30 días' },
  { id: 'mes_actual', label: 'Este mes' },
  { id: 'mes_anterior', label: 'Mes anterior' },
  { id: 'personalizado', label: 'Personalizado' },
];

/** Últimos 7 días como punto de partida del período personalizado (igual que la web). */
export function rangoPorDefecto(ahora = Date.now()): { desde: string; hasta: string } {
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return { desde: iso(ahora - 7 * 86_400_000), hasta: iso(ahora) };
}

/** "2026-11-08" real (sin 31 de febrero). En el teléfono la fecha se escribe a mano. */
export function fechaIsoValida(valor: string | undefined): boolean {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = new Date(`${valor}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}

/** El rango personalizado se consulta solo si las dos fechas son válidas y en orden. */
export function rangoListo(desde?: string, hasta?: string): boolean {
  return fechaIsoValida(desde) && fechaIsoValida(hasta) && (desde as string) <= (hasta as string);
}

/** Query string de /dashboard/ejecutivo con la misma lógica de la web (fechas solo si es personalizado). */
export function consultaEjecutivo(f: FiltroDashboardEjecutivo): string {
  const q = new URLSearchParams();
  if (f.periodo) q.set('periodo', f.periodo);
  if (f.periodo === 'personalizado') {
    if (f.fechaInicio) q.set('fechaInicio', f.fechaInicio);
    if (f.fechaFin) q.set('fechaFin', f.fechaFin);
  }
  if (f.sucursalId) q.set('sucursalId', f.sucursalId);
  const qs = q.toString();
  return `/dashboard/ejecutivo${qs ? `?${qs}` : ''}`;
}

export function consultaOperativo(sucursalId?: string): string {
  return sucursalId ? `/dashboard/operativo?sucursalId=${encodeURIComponent(sucursalId)}` : '/dashboard/operativo';
}
