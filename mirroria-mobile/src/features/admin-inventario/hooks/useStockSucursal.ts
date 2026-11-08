import { useCallback, useEffect, useState } from 'react';
import { inventarioApi } from '../api/inventarioApi';
import { sucursalesPermitidas } from '../lib/stock';
import type { InventarioSucursal, Sucursal, VarianteConProducto } from '../types/inventario.types';

/**
 * Sucursales que puede ver quien entra, catálogo aplanado a variantes y el
 * stock de la sucursal elegida. La encargada queda fija en la suya.
 */
export function useStockSucursal(habilitado: boolean, role: string | undefined, sucursalPropia?: string | null) {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [variantes, setVariantes] = useState<VarianteConProducto[]>([]);
  const [sucursalId, setSucursalId] = useState('');
  const [filas, setFilas] = useState<InventarioSucursal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoStock, setCargandoStock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const cargarBase = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [todas, vars] = await Promise.all([inventarioApi.getSucursales(), inventarioApi.getVariantes()]);
      const permitidas = sucursalesPermitidas(todas, role, sucursalPropia);
      setSucursales(permitidas);
      setVariantes(vars);
      setSucursalId((actual) => (permitidas.some((s) => s.id === actual) ? actual : permitidas[0]?.id ?? ''));
    } catch {
      setError('No se pudo cargar el inventario');
    } finally {
      setCargando(false);
    }
  }, [role, sucursalPropia]);

  useEffect(() => {
    if (habilitado) cargarBase();
  }, [habilitado, cargarBase]);

  useEffect(() => {
    if (!sucursalId) {
      setFilas([]);
      return;
    }
    let cancelado = false;
    setCargandoStock(true);
    inventarioApi
      .getDisponibilidad({ sucursalId })
      .then((d) => !cancelado && setFilas(d))
      .catch(() => !cancelado && setError('No se pudo cargar el stock de la sucursal'))
      .finally(() => !cancelado && setCargandoStock(false));
    return () => {
      cancelado = true;
    };
  }, [sucursalId, version]);

  return {
    sucursales,
    variantes,
    sucursalId,
    setSucursalId,
    filas,
    cargando,
    cargandoStock,
    error,
    /** Vuelve a pedir el stock (después de un ajuste o una recepción). */
    refrescarStock: () => setVersion((v) => v + 1),
    recargarTodo: async () => {
      await cargarBase();
      setVersion((v) => v + 1);
    },
  };
}
