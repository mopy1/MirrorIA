import { useQuery } from '@tanstack/react-query';
import { useSesion } from '@/contexts/SesionContext';
import { misVentas, obtenerVenta, type VentaDto } from '@/features/pagos/api/pagos.api';
import { conCache } from '@/lib/api/con-cache';
import { ErrorSinRed } from '@/lib/api/errores';
import { leerConfigJson } from '@/lib/db/repos/configuracion.repo';

/** `GET /ventas/mias`, más nuevas primero; sin red, lo último guardado. */
export function useMisVentas() {
  const { sesion } = useSesion();
  const usuarioId = sesion?.usuario.id;
  return useQuery({
    queryKey: ['ventas', 'mias', usuarioId],
    enabled: !!usuarioId,
    networkMode: 'always',
    queryFn: async () => {
      const r = await conCache(`ventas_json:${usuarioId}`, misVentas);
      return { ...r, datos: [...r.datos].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)) };
    },
  });
}

/** `GET /ventas/:id`; sin red, la copia de la lista guardada. `refetchInterval` lo decide quien llama (polling del pago). */
export function useVenta(ventaId: string | undefined, refetchInterval?: (v: VentaDto | undefined) => number | false) {
  const { sesion } = useSesion();
  const usuarioId = sesion?.usuario.id;
  return useQuery({
    queryKey: ['ventas', 'una', ventaId],
    enabled: !!ventaId && !!usuarioId,
    networkMode: 'always',
    refetchInterval: refetchInterval ? (q) => refetchInterval(q.state.data) : undefined,
    queryFn: async () => {
      try {
        return await obtenerVenta(ventaId!);
      } catch (e) {
        const copia = e instanceof ErrorSinRed ? (await leerConfigJson<VentaDto[]>(`ventas_json:${usuarioId}`))?.find((v) => v.id === ventaId) : null;
        if (copia) return copia;
        throw e;
      }
    },
  });
}
