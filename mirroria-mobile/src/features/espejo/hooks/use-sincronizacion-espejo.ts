import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSesion } from '@/contexts/SesionContext';
import { useTienda } from '@/contexts/TiendaContext';
import { obtenerTienda } from '@/features/tiendas/api/tiendas.api';
import { revisarAvisos } from '@/lib/avisos/revisar-avisos';
import { reemplazarEspejo } from '@/lib/db/repos/espejo.repo';
import { descargarSnapshot } from '../api/espejo.api';

export const CLAVE_SYNC = ['espejo', 'sync'] as const;
const CINCO_MIN = 5 * 60 * 1000;

/**
 * Mantiene fresco el espejo SQLite. Disparadores (spec §4.3): elegir tienda y login
 * (cambia la clave), reconexión (onlineManager ← NetInfoListener), cada 5 min con red
 * y pull-to-refresh (`refetchQueries(CLAVE_SYNC)`). Sin red la query queda en pausa.
 * Tras cada snapshot revisa los avisos de stock (M4.2).
 */
export function useSincronizacionEspejo() {
  const { tienda, elegirTienda } = useTienda();
  const { sesion } = useSesion();
  const qc = useQueryClient();
  const usuarioId = sesion?.usuario.id ?? null;

  return useQuery({
    queryKey: [...CLAVE_SYNC, tienda?.id ?? null, usuarioId],
    enabled: !!tienda,
    refetchInterval: CINCO_MIN,
    refetchOnReconnect: 'always',
    retry: 1,
    queryFn: async () => {
      const snapshot = await descargarSnapshot(usuarioId);
      await reemplazarEspejo(tienda!.id, snapshot);
      await qc.invalidateQueries({ queryKey: ['vitrina'] });
      // "Avisame cuando vuelva": tras cada snapshot, 0 → >0 dispara la notificación local.
      await revisarAvisos(tienda!.id).catch(() => 0);
      await qc.invalidateQueries({ queryKey: ['avisos'] });
      const fresca = await obtenerTienda(tienda!.slug).catch(() => null);
      if (fresca && JSON.stringify(fresca.marca) !== JSON.stringify(tienda!.marca)) await elegirTienda(fresca);
      return Date.now();
    },
  });
}
