import { useQuery } from '@tanstack/react-query';
import { useTienda } from '@/contexts/TiendaContext';
import { TTL_ESPEJO_MS } from '@/lib/config';
import { estadoEspejo, listarPrendas } from '@/lib/db/repos/vitrina.repo';

/** Vitrina leída SIEMPRE de SQLite (D3); la red solo refresca el espejo. */
export function useVitrina() {
  const { tienda } = useTienda();
  return useQuery({
    queryKey: ['vitrina', 'lista', tienda?.id],
    enabled: !!tienda,
    networkMode: 'always',
    staleTime: Infinity,
    queryFn: async () => {
      const [prendas, estado] = await Promise.all([listarPrendas(tienda!.id), estadoEspejo(tienda!.id)]);
      const vencido = estado.ultimoSync !== null && Date.now() - estado.ultimoSync > TTL_ESPEJO_MS;
      return { prendas, estado, vencido };
    },
  });
}
