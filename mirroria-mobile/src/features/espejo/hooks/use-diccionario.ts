import { useQuery } from '@tanstack/react-query';
import { useTienda } from '@/contexts/TiendaContext';
import { cargarDiccionario } from '@/lib/db/repos/detalle.repo';

/** Nombres de prendas y sucursales del espejo (SQLite, funciona sin red). Se invalida con `['vitrina']`. */
export function useDiccionario() {
  const { tienda } = useTienda();
  return useQuery({
    queryKey: ['vitrina', 'diccionario', tienda?.id],
    enabled: !!tienda,
    networkMode: 'always',
    staleTime: Infinity,
    queryFn: () => cargarDiccionario(tienda!.id),
  });
}
