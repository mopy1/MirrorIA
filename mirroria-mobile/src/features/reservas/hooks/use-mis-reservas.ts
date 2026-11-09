import { useQuery } from '@tanstack/react-query';
import { useSesion } from '@/contexts/SesionContext';
import { conCache } from '@/lib/api/con-cache';
import { ErrorSinRed } from '@/lib/api/errores';
import { leerConfigJson } from '@/lib/db/repos/configuracion.repo';
import { misReservas, obtenerReserva, type ReservaDto } from '../api/reservas.api';

/** `GET /reservas/mias` (próximas primero); sin red, lo último guardado (el pase se muestra sin señal). */
export function useMisReservas() {
  const { sesion } = useSesion();
  const usuarioId = sesion?.usuario.id;
  return useQuery({
    queryKey: ['reservas', 'mias', usuarioId],
    enabled: !!usuarioId,
    networkMode: 'always',
    queryFn: async () => {
      const r = await conCache(`reservas_json:${usuarioId}`, misReservas);
      return { ...r, datos: [...r.datos].sort((a, b) => Date.parse(b.fechaHoraPrevista) - Date.parse(a.fechaHoraPrevista)) };
    },
  });
}

/** Pase de Tienda: `GET /reservas/:id` al enfocar y cada 15 s (spec §3.2), así ve el EN_TIENDA que marca la cajera. */
export function useReserva(reservaId: string | undefined) {
  const { sesion } = useSesion();
  const usuarioId = sesion?.usuario.id;
  return useQuery({
    queryKey: ['reservas', 'una', reservaId],
    enabled: !!reservaId && !!usuarioId,
    networkMode: 'always',
    refetchInterval: 15_000,
    queryFn: async (): Promise<{ reserva: ReservaDto; guardado: boolean }> => {
      try {
        return { reserva: await obtenerReserva(reservaId!), guardado: false };
      } catch (e) {
        const copia = e instanceof ErrorSinRed ? (await leerConfigJson<ReservaDto[]>(`reservas_json:${usuarioId}`))?.find((r) => r.id === reservaId) : null;
        if (copia) return { reserva: copia, guardado: true };
        throw e;
      }
    },
  });
}
