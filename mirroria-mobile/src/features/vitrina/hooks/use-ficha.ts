import { useQuery } from '@tanstack/react-query';
import { useTienda } from '@/contexts/TiendaContext';
import { obtenerFicha } from '@/lib/db/repos/vitrina.repo';

/** Ficha de prenda desde SQLite: variantes + stock libre por sucursal (v_stock_libre). */
export function useFicha(productoId: string) {
  const { tienda } = useTienda();
  return useQuery({
    queryKey: ['vitrina', 'ficha', tienda?.id, productoId],
    enabled: !!tienda && !!productoId,
    networkMode: 'always',
    staleTime: Infinity,
    queryFn: () => obtenerFicha(tienda!.id, productoId),
  });
}
