import { useMemo, useState } from 'react';
import { dimensionDelReporte } from '../lib/catalogo';
import { etiquetaFila } from '../lib/formato';
import { filtrarFilas, ordenarFilas, siguienteOrden, type ColumnaOrden, type DireccionOrden } from '../lib/tabla';
import type { Reporte } from '../types/reports.types';

/** Estado de la tabla: búsqueda en vivo y orden por columna. */
export function useTablaDinamica(reporte: Reporte) {
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<{ columna: ColumnaOrden; direccion: DireccionOrden }>({ columna: 'valor', direccion: 'desc' });
  const dimension = dimensionDelReporte(reporte);

  const filas = useMemo(() => {
    const filtradas = filtrarFilas(reporte.filas, busqueda, (e) => etiquetaFila(e, dimension));
    return ordenarFilas(filtradas, orden.columna, orden.direccion, reporte.comparacion?.variaciones);
  }, [reporte, busqueda, orden, dimension]);

  return {
    busqueda,
    setBusqueda,
    orden,
    ordenarPor: (col: ColumnaOrden) => setOrden((actual) => siguienteOrden(actual, col)),
    filas,
    totalFilas: reporte.filas.length,
  };
}
