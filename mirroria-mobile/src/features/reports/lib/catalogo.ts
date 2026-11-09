import type { OpcionSelector, Reporte } from '../types/reports.types';

/**
 * Vocabulario del catálogo del backend (`mirroria-backend/src/modules/ia/service/catalogo-metricas.ts`),
 * igual que la web (`report-metricas.ts` y `constructor-reporte.data.ts`). Se mantiene a mano.
 */

/** Métricas del constructor sin IA (mismas que la web). */
export const METRICAS_DISPONIBLES: OpcionSelector[] = [
  { id: 'ingresos', label: 'Ingresos (Bs)' },
  { id: 'unidades', label: 'Unidades vendidas' },
  { id: 'cantidad_ventas', label: 'Cantidad de ventas' },
  { id: 'ticket_promedio', label: 'Ticket promedio (Bs)' },
  { id: 'descuentos', label: 'Descuentos aplicados (Bs)' },
  { id: 'stock_disponible', label: 'Stock disponible' },
  { id: 'stock_reservado', label: 'Stock reservado' },
  { id: 'cantidad_reservas', label: 'Cantidad de reservas' },
  { id: 'descuento_por_cupon', label: 'Canjes de cupón (Bs)' },
];

/** Dimensiones del constructor sin IA (mismas que la web). */
export const DIMENSIONES_DISPONIBLES: OpcionSelector[] = [
  { id: 'categoria', label: 'Categoría' },
  { id: 'producto', label: 'Producto' },
  { id: 'sucursal', label: 'Sucursal' },
  { id: 'canal', label: 'Canal (Web / Presencial)' },
  { id: 'metodo_pago', label: 'Método de pago' },
  { id: 'proveedor_pago', label: 'Pasarela de pago' },
  { id: 'proveedor', label: 'Proveedor de colección' },
  { id: 'mes', label: 'Mes' },
  { id: 'dia', label: 'Día' },
];

export type FiltroExtra = 'canal' | 'metodoPago';

interface InfoMetrica {
  /** Con artículo, para frases: "las unidades vendidas". */
  nombre: string;
  /** Sumar filas tiene sentido (no para promedios ni clientas únicas). */
  aditiva: boolean;
  /** Dimensiones por las que el backend acepta agrupar esta métrica. */
  dimensiones: readonly string[];
  /** El backend no admite comparar contra el período anterior (foto del presente, sin fechas). */
  sinTiempo?: boolean;
  /** Filtros extra que la métrica acepta, además de la sucursal y las fechas. */
  filtros?: readonly FiltroExtra[];
}

const DIMS_VENTAS = ['sucursal', 'canal', 'estado', 'dia', 'mes', 'categoria', 'producto', 'cliente', 'metodo_pago', 'proveedor_pago'] as const;
const DIMS_CABECERA = DIMS_VENTAS.filter((d) => d !== 'categoria' && d !== 'producto');
const DIMS_INVENTARIO = ['sucursal', 'categoria', 'producto'] as const;
const DIMS_KARDEX = ['sucursal', 'tipo_movimiento', 'producto', 'categoria', 'dia', 'mes'] as const;
const DIMS_RESERVAS = ['estado', 'sucursal', 'dia', 'mes'] as const;
const DIMS_CUPONES = ['cupon', 'sucursal', 'mes'] as const;
const DIMS_COMPRAS = ['estado', 'proveedor', 'sucursal', 'mes'] as const;
const F_VENTAS: readonly FiltroExtra[] = ['canal', 'metodoPago'];

const METRICAS: Record<string, InfoMetrica> = {
  ingresos: { nombre: 'los ingresos', aditiva: true, dimensiones: [...DIMS_VENTAS, 'proveedor'], filtros: F_VENTAS },
  unidades: { nombre: 'las unidades vendidas', aditiva: true, dimensiones: [...DIMS_VENTAS, 'proveedor'], filtros: F_VENTAS },
  cantidad_ventas: { nombre: 'la cantidad de ventas', aditiva: true, dimensiones: DIMS_VENTAS, filtros: F_VENTAS },
  ticket_promedio: { nombre: 'el gasto promedio por compra', aditiva: false, dimensiones: DIMS_CABECERA, filtros: F_VENTAS },
  descuentos: { nombre: 'los descuentos', aditiva: true, dimensiones: DIMS_CABECERA, filtros: F_VENTAS },
  clientes_activos: { nombre: 'las clientas que compraron', aditiva: false, dimensiones: DIMS_VENTAS },
  stock_disponible: { nombre: 'el stock disponible', aditiva: true, dimensiones: DIMS_INVENTARIO, sinTiempo: true },
  stock_reservado: { nombre: 'el stock reservado', aditiva: true, dimensiones: DIMS_INVENTARIO, sinTiempo: true },
  stock_en_transito: { nombre: 'el stock en camino', aditiva: true, dimensiones: DIMS_INVENTARIO, sinTiempo: true },
  movimientos_unidades: { nombre: 'las unidades movidas en inventario', aditiva: true, dimensiones: DIMS_KARDEX },
  movimientos_conteo: { nombre: 'los movimientos de inventario', aditiva: true, dimensiones: DIMS_KARDEX },
  cantidad_reservas: { nombre: 'las reservas', aditiva: true, dimensiones: DIMS_RESERVAS },
  unidades_reservadas: { nombre: 'las prendas reservadas', aditiva: true, dimensiones: DIMS_RESERVAS },
  canjes_cupon: { nombre: 'los cupones usados', aditiva: true, dimensiones: DIMS_CUPONES, filtros: ['canal'] },
  descuento_por_cupon: { nombre: 'el descuento por cupones', aditiva: true, dimensiones: DIMS_CUPONES, filtros: ['canal'] },
  cantidad_ordenes: { nombre: 'las órdenes de compra', aditiva: true, dimensiones: DIMS_COMPRAS },
  unidades_pedidas: { nombre: 'las unidades pedidas a proveedores', aditiva: true, dimensiones: DIMS_COMPRAS },
  unidades_recibidas: { nombre: 'las unidades recibidas de proveedores', aditiva: true, dimensiones: DIMS_COMPRAS },
  stock_proveedores: { nombre: 'las unidades pendientes de proveedores', aditiva: true, dimensiones: [] },
  cantidad_usuarios: { nombre: 'las personas del equipo', aditiva: true, dimensiones: ['rol'] },
  cantidad_productos: { nombre: 'las prendas del catálogo', aditiva: true, dimensiones: ['categoria'] },
};

/** [singular, plural] de cada dimensión, en minúscula. */
const DIMENSIONES: Record<string, [string, string]> = {
  sucursal: ['sucursal', 'sucursales'],
  categoria: ['categoría', 'categorías'],
  producto: ['prenda', 'prendas'],
  canal: ['canal de venta', 'canales de venta'],
  estado: ['estado', 'estados'],
  cliente: ['clienta', 'clientas'],
  metodo_pago: ['forma de pago', 'formas de pago'],
  proveedor_pago: ['pasarela de pago', 'pasarelas de pago'],
  proveedor: ['proveedor', 'proveedores'],
  tipo_movimiento: ['tipo de movimiento', 'tipos de movimiento'],
  cupon: ['cupón', 'cupones'],
  rol: ['rol', 'roles'],
  dia: ['día', 'días'],
  mes: ['mes', 'meses'],
};

export const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Dimensiones del constructor válidas para la métrica elegida (evita combinaciones que el backend rechaza). */
export function dimensionesParaMetrica(metrica: string): OpcionSelector[] {
  const validas = METRICAS[metrica]?.dimensiones ?? [];
  return DIMENSIONES_DISPONIBLES.filter((d) => validas.includes(d.id));
}

/** Stock: es una foto de hoy, no tiene rango de fechas ni período anterior. */
export function metricaConTiempo(metrica: string): boolean {
  return !METRICAS[metrica]?.sinTiempo;
}

export function filtrosDeMetrica(metrica: string): readonly FiltroExtra[] {
  return METRICAS[metrica]?.filtros ?? [];
}

/** Métrica real del reporte; en un reporte de la IA, la que consultó el agente. */
export function metricaDelReporte(reporte: Reporte): string | null {
  const { metrica } = reporte.ficha;
  if (METRICAS[metrica]) return metrica;
  const consulta = [...(reporte.pasosEjecutados ?? [])].reverse().find((p) => p.herramienta === 'consultar_metricas');
  const desdePaso = consulta?.argumentos.metrica;
  if (typeof desdePaso !== 'string') return null;
  return desdePaso === 'ventas_totales' ? 'ingresos' : desdePaso;
}

/** Dimensión real: `ficha.agruparPor`, o la que usó el agente IA (el híbrido trae "hibrido"). */
export function dimensionDelReporte(reporte: Reporte): string | null {
  const { agruparPor } = reporte.ficha;
  if (DIMENSIONES[agruparPor] || agruparPor === 'ninguno') return agruparPor;
  const consulta = [...(reporte.pasosEjecutados ?? [])].reverse().find((p) => p.herramienta === 'consultar_metricas');
  const dim = consulta?.argumentos.dimension;
  return typeof dim === 'string' && (DIMENSIONES[dim] || dim === 'ninguno') ? dim : null;
}

export function nombreMetrica(metrica: string | null): string {
  return (metrica && METRICAS[metrica]?.nombre) || 'el valor';
}

export function esMetricaAditiva(metrica: string | null): boolean {
  return metrica ? (METRICAS[metrica]?.aditiva ?? true) : true;
}

export function nombreDimension(dimension: string | null, plural = false): string | null {
  const par = dimension ? DIMENSIONES[dimension] : undefined;
  return par ? par[plural ? 1 : 0] : null;
}

/** Opciones de "Ver por" (repivoteo): solo dimensiones que el backend acepta para esa métrica. */
export function opcionesPivote(metrica: string | null): OpcionSelector[] {
  const dims = metrica ? (METRICAS[metrica]?.dimensiones ?? []) : [];
  return dims.map((id) => ({ id, label: capitalizar(DIMENSIONES[id][0]) }));
}
