import { useQuery } from '@tanstack/react-query';
import { useTienda } from '@/contexts/TiendaContext';
import { listarPrendasProbador } from '@/lib/db/repos/probador.repo';
import { prendasProbables } from '@/lib/probador/prendas';

/** Tira de prendas del probador: SIEMPRE desde SQLite, como la vitrina (se invalida con `['vitrina']`). */
export function usePrendasProbador() {
  const { tienda } = useTienda();
  return useQuery({
    queryKey: ['vitrina', 'probador', tienda?.id],
    enabled: !!tienda,
    networkMode: 'always',
    staleTime: Infinity,
    queryFn: async () => prendasProbables(await listarPrendasProbador(tienda!.id)),
  });
}
