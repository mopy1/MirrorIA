import { useQuery } from '@tanstack/react-query';
import { useSesion } from '@/contexts/SesionContext';
import { useTienda } from '@/contexts/TiendaContext';
import { listarCarritoLocal } from '@/lib/db/repos/carrito.repo';

/** Último carrito del servidor guardado en SQLite (se ve sin red). */
export function useCarritoLocal() {
  const { tienda } = useTienda();
  const { sesion } = useSesion();
  return useQuery({
    queryKey: ['vitrina', 'carrito', tienda?.id, sesion?.usuario.id],
    enabled: !!tienda && !!sesion,
    networkMode: 'always',
    staleTime: Infinity,
    queryFn: () => listarCarritoLocal(tienda!.id, sesion!.usuario.id),
  });
}
