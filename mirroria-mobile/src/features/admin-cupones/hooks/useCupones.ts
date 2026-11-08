import { useCallback, useEffect, useState } from 'react';
import { cuponesApi } from '../api/cuponesApi';
import { mensajeDeError } from '../lib/comunes';
import type { CreateCuponDto, Cupon } from '../types/cupones.types';

/** Listado + alta + activar/desactivar, como useCupones de la web. */
export function useCupones() {
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [cambiandoId, setCambiandoId] = useState<string | null>(null);

  const cargar = useCallback(async (esRecarga = false) => {
    if (esRecarga) setRecargando(true);
    setError(null);
    try {
      setCupones(await cuponesApi.getCupones());
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudieron cargar los cupones'));
    } finally {
      setCargando(false);
      setRecargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crear(dto: CreateCuponDto): Promise<boolean> {
    setGuardando(true);
    setErrorAccion(null);
    try {
      await cuponesApi.createCupon(dto);
      await cargar();
      return true;
    } catch (err) {
      setErrorAccion(mensajeDeError(err, 'Error al crear el cupón'));
      return false;
    } finally {
      setGuardando(false);
    }
  }

  async function alternarEstado(id: string) {
    setCambiandoId(id);
    setErrorAccion(null);
    try {
      const actualizado = await cuponesApi.toggleEstado(id);
      setCupones((lista) => lista.map((c) => (c.id === id ? actualizado : c)));
    } catch (err) {
      setErrorAccion(mensajeDeError(err, 'Error al cambiar estado'));
    } finally {
      setCambiandoId(null);
    }
  }

  return {
    cupones,
    cargando,
    recargando,
    error,
    guardando,
    errorAccion,
    limpiarErrorAccion: () => setErrorAccion(null),
    cambiandoId,
    recargar: () => cargar(true),
    crear,
    alternarEstado,
  };
}
