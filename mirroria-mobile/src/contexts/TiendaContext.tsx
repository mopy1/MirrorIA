import * as React from 'react';
import type { TiendaDirectorio } from '@/features/tiendas/types/tienda.types';
import { contextoHttp } from '@/lib/api/contexto-http';
import { escribirConfig, leerConfigJson } from '@/lib/db/repos/configuracion.repo';

interface ValorTienda {
  /** Tienda elegida (con su marca cacheada) o null en el primer arranque. */
  tienda: TiendaDirectorio | null;
  cargada: boolean;
  elegirTienda: (t: TiendaDirectorio) => Promise<void>;
}

const Ctx = React.createContext<ValorTienda | null>(null);

/** Tienda activa persistida en `configuracion_sync` (tienda_slug + tienda_json): sin parpadeo al reabrir. */
export function TiendaProvider({ children }: { children: React.ReactNode }) {
  const [tienda, setTienda] = React.useState<TiendaDirectorio | null>(null);
  const [cargada, setCargada] = React.useState(false);

  React.useEffect(() => {
    leerConfigJson<TiendaDirectorio>('tienda_json')
      .then((t) => {
        contextoHttp.tenantSlug = t?.slug ?? null;
        setTienda(t);
      })
      .finally(() => setCargada(true));
  }, []);

  const elegirTienda = React.useCallback(async (t: TiendaDirectorio) => {
    await escribirConfig('tienda_slug', t.slug);
    await escribirConfig('tienda_json', JSON.stringify(t));
    contextoHttp.tenantSlug = t.slug;
    setTienda(t);
  }, []);

  const valor = React.useMemo(() => ({ tienda, cargada, elegirTienda }), [tienda, cargada, elegirTienda]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useTienda(): ValorTienda {
  const v = React.useContext(Ctx);
  if (!v) throw new Error('useTienda fuera de TiendaProvider');
  return v;
}
