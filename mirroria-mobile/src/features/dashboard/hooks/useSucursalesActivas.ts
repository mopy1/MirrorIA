import { useEffect, useState } from 'react';
import type { SucursalResponseDto } from '@/src/features/sucursales/types/sucursales.types';
import { dashboardApi } from '../api/dashboardApi';

/** Sucursales activas para el filtro. Si falla, el filtro queda en "Todas" (como la web). */
export function useSucursalesActivas(enabled = true): SucursalResponseDto[] {
  const [sucursales, setSucursales] = useState<SucursalResponseDto[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let activo = true;
    dashboardApi
      .sucursalesActivas()
      .then((s) => activo && setSucursales(s))
      .catch(() => activo && setSucursales([]));
    return () => {
      activo = false;
    };
  }, [enabled]);
  return sucursales;
}
