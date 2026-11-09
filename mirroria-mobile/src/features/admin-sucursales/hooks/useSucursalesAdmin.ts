import { useCallback, useEffect, useState } from 'react';
import { mensajeDeError } from '@/src/features/admin-cupones/lib/comunes';
import { sucursalesAdminApi } from '../api/sucursalesAdminApi';
import type { Ciudad, CreateSucursalDto, Sucursal } from '../types/sucursales-admin.types';

/** Sucursales + ciudades globales + alta (el 409 de límite del plan llega en `errorAlta`). */
export function useSucursalesAdmin() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorAlta, setErrorAlta] = useState<string | null>(null);

  const cargar = useCallback(async (esRecarga = false) => {
    if (esRecarga) setRecargando(true);
    setError(null);
    try {
      const [s, c] = await Promise.all([sucursalesAdminApi.getSucursales(), sucursalesAdminApi.getCiudades()]);
      setSucursales(s);
      setCiudades(c);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudieron cargar las sucursales'));
    } finally {
      setCargando(false);
      setRecargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crear(dto: CreateSucursalDto): Promise<boolean> {
    setGuardando(true);
    setErrorAlta(null);
    try {
      await sucursalesAdminApi.createSucursal(dto);
      await cargar();
      return true;
    } catch (err) {
      setErrorAlta(mensajeDeError(err, 'No se pudo guardar'));
      return false;
    } finally {
      setGuardando(false);
    }
  }

  return {
    sucursales,
    ciudades,
    cargando,
    recargando,
    error,
    guardando,
    errorAlta,
    limpiarErrorAlta: () => setErrorAlta(null),
    recargar: () => cargar(true),
    crear,
  };
}
