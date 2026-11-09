import type { FilaReporte, Variacion } from '../types/reports.types';

export type ColumnaOrden = 'etiqueta' | 'valor' | 'anterior' | 'variacion';
export type DireccionOrden = 'asc' | 'desc';

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Búsqueda sin importar mayúsculas ni tildes; `etiquetar` busca también sobre la etiqueta que se ve ("5 oct"). */
export function filtrarFilas(filas: FilaReporte[], busqueda: string, etiquetar: (e: string) => string = (e) => e): FilaReporte[] {
  const q = normalizar(busqueda);
  if (!q) return filas;
  return filas.filter((f) => normalizar(etiquetar(f.etiqueta)).includes(q) || normalizar(f.etiqueta).includes(q));
}

export function ordenarFilas(filas: FilaReporte[], columna: ColumnaOrden, direccion: DireccionOrden, variaciones?: Variacion[]): FilaReporte[] {
  const signo = direccion === 'asc' ? 1 : -1;
  const de = (f: FilaReporte): number => {
    if (columna === 'anterior' && variaciones) return variaciones.find((v) => v.clave === f.clave)?.anterior ?? 0;
    if (columna === 'variacion' && variaciones) return variaciones.find((v) => v.clave === f.clave)?.deltaPorcentual ?? -999999;
    return Number(f.valor) || 0;
  };
  return [...filas].sort((a, b) => {
    if (columna === 'etiqueta') return signo * a.etiqueta.toLowerCase().localeCompare(b.etiqueta.toLowerCase());
    return signo * (de(a) - de(b));
  });
}

/** Tocar la misma columna invierte el orden; una nueva arranca de mayor a menor (o A→Z para el nombre). */
export function siguienteOrden(
  actual: { columna: ColumnaOrden; direccion: DireccionOrden },
  columna: ColumnaOrden
): { columna: ColumnaOrden; direccion: DireccionOrden } {
  if (actual.columna === columna) return { columna, direccion: actual.direccion === 'asc' ? 'desc' : 'asc' };
  return { columna, direccion: columna === 'etiqueta' ? 'asc' : 'desc' };
}

export interface Totales {
  total: number;
  anterior: number;
  /** Variación ponderada; null si no hay comparación o el anterior fue 0. */
  delta: number | null;
}

/** Total de las filas visibles (respeta la búsqueda) y su variación contra el período anterior. */
export function calcularTotales(filas: FilaReporte[], variaciones?: Variacion[]): Totales {
  const total = filas.reduce((acc, f) => acc + (Number(f.valor) || 0), 0);
  const anterior = variaciones
    ? filas.reduce((acc, f) => acc + (Number(variaciones.find((x) => x.clave === f.clave)?.anterior) || 0), 0)
    : 0;
  const delta = variaciones && anterior > 0 ? ((total - anterior) / anterior) * 100 : null;
  return { total, anterior, delta };
}

export function textoConteo(visibles: number, total: number): string {
  return visibles === total ? `${total} ${total === 1 ? 'fila' : 'filas'}` : `${visibles} de ${total} filas`;
}
