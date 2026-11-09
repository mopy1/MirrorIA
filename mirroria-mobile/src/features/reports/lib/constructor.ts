import type { Ficha, OpcionSelector } from '../types/reports.types';
import { DIMENSIONES_DISPONIBLES, METRICAS_DISPONIBLES, capitalizar, nombreDimension, dimensionesParaMetrica, filtrosDeMetrica, metricaConTiempo } from './catalogo';

/** Rangos de fecha del constructor (mismos que la web). */
export const RANGOS_PRESET: OpcionSelector[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'ultimos_7', label: 'Últimos 7 días' },
  { id: 'ultimos_30', label: 'Últimos 30 días' },
  { id: 'este_mes', label: 'Este mes' },
  { id: 'mes_anterior', label: 'Mes anterior' },
  { id: 'historico', label: 'Histórico completo' },
];

export const CANALES: OpcionSelector[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'PRESENCIAL', label: 'En tienda' },
  { id: 'WEB', label: 'Tienda online' },
];

export const METODOS_PAGO: OpcionSelector[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'QR', label: 'QR' },
  { id: 'TARJETA', label: 'Tarjeta' },
  { id: 'EFECTIVO', label: 'Efectivo' },
];

export const LIMITES = [5, 10, 20, 50, 100] as const;

const DIA = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Mismo cálculo que la web (`resolverRango`); `ahora` se inyecta para poder probarlo. */
export function resolverRango(preset: string, ahora = new Date()): { desde?: string; hasta?: string } {
  const hoy = iso(ahora);
  if (preset === 'hoy') return { desde: hoy, hasta: hoy };
  if (preset === 'ultimos_7') return { desde: iso(new Date(ahora.getTime() - 7 * DIA)), hasta: hoy };
  if (preset === 'ultimos_30') return { desde: iso(new Date(ahora.getTime() - 30 * DIA)), hasta: hoy };
  if (preset === 'este_mes') {
    return { desde: `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-01`, hasta: hoy };
  }
  if (preset === 'mes_anterior') {
    const anio = ahora.getMonth() === 0 ? ahora.getFullYear() - 1 : ahora.getFullYear();
    const mes = ahora.getMonth() === 0 ? 12 : ahora.getMonth();
    const mm = String(mes).padStart(2, '0');
    const ultimoDia = new Date(anio, mes, 0).getDate();
    return { desde: `${anio}-${mm}-01`, hasta: `${anio}-${mm}-${String(ultimoDia).padStart(2, '0')}` };
  }
  return { desde: undefined, hasta: undefined };
}

/** El período de igual largo inmediatamente anterior (para la columna "Período anterior"). */
export function calcularPeriodoAnterior(desde?: string, hasta?: string): { desde: string; hasta: string } | undefined {
  if (!desde || !hasta) return undefined;
  const largo = new Date(hasta).getTime() - new Date(desde).getTime();
  const antHasta = iso(new Date(new Date(desde).getTime() - DIA));
  const antDesde = iso(new Date(new Date(antHasta).getTime() - largo));
  return { desde: antDesde, hasta: antHasta };
}

export interface OpcionesConstructor {
  metrica: string;
  agruparPor: string;
  presetFecha: string;
  /** 'todas' o el id de una sucursal. */
  sucursalId: string;
  canal: string;
  metodoPago: string;
  comparar: boolean;
  orden: 'asc' | 'desc';
  limite: number;
}

export const OPCIONES_INICIALES: OpcionesConstructor = {
  metrica: 'ingresos',
  agruparPor: 'categoria',
  presetFecha: 'este_mes',
  sucursalId: 'todas',
  canal: 'todos',
  metodoPago: 'todos',
  comparar: false,
  orden: 'desc',
  limite: 20,
};

/** Al cambiar de métrica: la agrupación, los filtros y la comparación que ya no apliquen se reacomodan. */
export function cambiarMetrica(op: OpcionesConstructor, metrica: string): OpcionesConstructor {
  const dims = dimensionesParaMetrica(metrica);
  const filtros = filtrosDeMetrica(metrica);
  return {
    ...op,
    metrica,
    agruparPor: dims.some((d) => d.id === op.agruparPor) ? op.agruparPor : (dims[0]?.id ?? 'ninguno'),
    canal: filtros.includes('canal') ? op.canal : 'todos',
    metodoPago: filtros.includes('metodoPago') ? op.metodoPago : 'todos',
    comparar: metricaConTiempo(metrica) ? op.comparar : false,
  };
}

/** Arma la ficha de `POST /ia/reportes/consulta` (mismo formato que manda la web). */
export function armarFicha(op: OpcionesConstructor, ahora = new Date()): Partial<Ficha> {
  const conTiempo = metricaConTiempo(op.metrica);
  const fechas = conTiempo ? resolverRango(op.presetFecha, ahora) : {};
  const filtros: Record<string, string | undefined> = {
    ...(fechas.desde ? { desde: fechas.desde } : {}),
    ...(fechas.hasta ? { hasta: fechas.hasta } : {}),
    ...(op.sucursalId !== 'todas' ? { sucursalId: op.sucursalId } : {}),
    ...(op.canal !== 'todos' ? { canal: op.canal } : {}),
    ...(op.metodoPago !== 'todos' ? { metodoPago: op.metodoPago } : {}),
  };
  const ficha: Partial<Ficha> = { metrica: op.metrica, agruparPor: op.agruparPor, filtros, orden: op.orden, limite: op.limite };
  if (op.comparar && conTiempo) {
    const anterior = calcularPeriodoAnterior(fechas.desde, fechas.hasta);
    if (anterior) ficha.compararCon = anterior;
  }
  return ficha;
}

/** "Ingresos (Bs) por Sucursal", igual que la etiqueta de pestaña de la web. */
export function tituloConstructor(metrica: string, agruparPor: string): string {
  const m = METRICAS_DISPONIBLES.find((x) => x.id === metrica)?.label ?? metrica;
  const d = DIMENSIONES_DISPONIBLES.find((x) => x.id === agruparPor)?.label ?? capitalizar(nombreDimension(agruparPor) ?? agruparPor);
  return `${m} por ${d}`;
}

/** Comparar necesita un rango cerrado: "Histórico completo" no tiene período anterior. */
export function puedeComparar(op: OpcionesConstructor): boolean {
  return metricaConTiempo(op.metrica) && op.presetFecha !== 'historico';
}
