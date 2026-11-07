import { useQuery } from '@tanstack/react-query';
import { escribirConfig, leerConfigJson } from '@/lib/db/repos/configuracion.repo';
import { listarTiendas } from '../api/tiendas.api';
import type { TiendaDirectorio } from '../types/tienda.types';

/**
 * Directorio de tiendas: red primero y caché en SQLite (`directorio_json`) para
 * poder cambiar de tienda sin red. Sin red y sin caché → error "Necesitás internet la primera vez".
 */
export function useDirectorio() {
  return useQuery({
    queryKey: ['directorio'],
    networkMode: 'always',
    retry: 0,
    queryFn: async (): Promise<{ tiendas: TiendaDirectorio[]; desdeCache: boolean }> => {
      try {
        const tiendas = await listarTiendas();
        await escribirConfig('directorio_json', JSON.stringify(tiendas));
        return { tiendas, desdeCache: false };
      } catch (e) {
        const cache = await leerConfigJson<TiendaDirectorio[]>('directorio_json');
        if (cache?.length) return { tiendas: cache, desdeCache: true };
        throw e;
      }
    },
  });
}
