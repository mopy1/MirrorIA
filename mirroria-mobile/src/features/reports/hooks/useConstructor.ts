import { useEffect, useState } from 'react';
import { sucursalesApi } from '@/src/features/sucursales/api/sucursalesApi';
import { reportsApi } from '../api/reportsApi';
import { OPCIONES_INICIALES, armarFicha, cambiarMetrica, tituloConstructor, type OpcionesConstructor } from '../lib/constructor';
import type { OpcionSelector, Reporte } from '../types/reports.types';

/**
 * Constructor de reportes sin IA (`POST /ia/reportes/consulta`).
 * La encargada no elige sucursal: el backend ya le recorta los datos a la suya.
 */
export function useConstructor(elegirSucursal: boolean, alGenerar: (reporte: Reporte, titulo: string) => void) {
  const [op, setOp] = useState<OpcionesConstructor>(OPCIONES_INICIALES);
  const [sucursales, setSucursales] = useState<OpcionSelector[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!elegirSucursal) return;
    sucursalesApi
      .getSucursales()
      .then((lista) => setSucursales(lista.filter((s) => s.activo).map((s) => ({ id: s.id, label: s.nombre }))))
      .catch(() => setSucursales([]));
  }, [elegirSucursal]);

  function cambiar<K extends keyof OpcionesConstructor>(campo: K, valor: OpcionesConstructor[K]) {
    setOp((prev) => (campo === 'metrica' ? cambiarMetrica(prev, String(valor)) : { ...prev, [campo]: valor }));
  }

  async function generar() {
    setCargando(true);
    setError(null);
    try {
      const reporte = await reportsApi.consultar(armarFicha(op));
      alGenerar(reporte, tituloConstructor(op.metrica, op.agruparPor));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo armar el reporte. Probá de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return { op, cambiar, sucursales, cargando, error, generar };
}
