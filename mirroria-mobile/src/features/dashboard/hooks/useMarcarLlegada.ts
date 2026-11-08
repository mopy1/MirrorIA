import { useState } from 'react';
import { dashboardApi } from '../api/dashboardApi';

/** "Ya llegó" en 1 toque: pasa la reserva a EN_TIENDA y recarga el día. */
export function useMarcarLlegada(onHecho?: () => void) {
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; mensaje: string } | null>(null);

  const marcarLlegada = async (reservaId: string) => {
    setActualizandoId(reservaId);
    setError(null);
    try {
      await dashboardApi.marcarLlegada(reservaId);
      onHecho?.();
    } catch (err) {
      const detalle = err instanceof Error && err.message ? ` (${err.message})` : '';
      setError({ id: reservaId, mensaje: `No pudimos marcar la llegada${detalle}. Probá de nuevo.` });
    } finally {
      setActualizandoId(null);
    }
  };

  return { marcarLlegada, actualizandoId, error };
}
