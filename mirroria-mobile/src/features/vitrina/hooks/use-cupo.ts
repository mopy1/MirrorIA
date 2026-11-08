import { useQuery } from '@tanstack/react-query';
import { useSesion } from '@/contexts/SesionContext';
import { ErrorSinRed } from '@/lib/api/errores';
import { escribirConfig, leerConfigJson } from '@/lib/db/repos/configuracion.repo';
import { obtenerCupo, type CupoReservas } from '../api/reservas.api';

/** Cupo de reservas: con red lo pide y lo guarda; sin red usa el último guardado (spec §3.2). */
export function useCupo() {
  const { sesion } = useSesion();
  const usuarioId = sesion?.usuario.id;
  return useQuery({
    queryKey: ['reservas', 'cupo', usuarioId],
    enabled: !!usuarioId,
    networkMode: 'always',
    queryFn: async (): Promise<{ cupo: CupoReservas | null; guardado: boolean }> => {
      try {
        const cupo = await obtenerCupo();
        await escribirConfig(`cupo_json:${usuarioId}`, JSON.stringify(cupo));
        return { cupo, guardado: false };
      } catch (e) {
        if (!(e instanceof ErrorSinRed)) throw e;
        return { cupo: await leerConfigJson<CupoReservas>(`cupo_json:${usuarioId}`), guardado: true };
      }
    },
  });
}
