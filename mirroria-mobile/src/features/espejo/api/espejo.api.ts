import { apiFetch } from '@/lib/api/cliente-http';
import { EP } from '@/lib/api/endpoints';
import type {
  CarritoDto, CategoriaDto, InventarioDto, ProductoDto, SnapshotEspejo, SucursalDto, TallaDto,
} from '@/lib/db/tipos-espejo';

/**
 * Baja el snapshot de la tienda activa (spec §4.3): sucursales, catálogo CON variantes
 * en una llamada (H1, `?conVariantes=true`), stock de todas las sucursales y, con sesión, el carrito.
 */
export async function descargarSnapshot(usuarioId: string | null): Promise<SnapshotEspejo> {
  const [sucursales, productos, inventario, categorias, tallas, carrito] = await Promise.all([
    apiFetch<SucursalDto[]>(EP.sucursales),
    apiFetch<ProductoDto[]>(EP.productosConVariantes),
    apiFetch<InventarioDto[]>(EP.inventario),
    apiFetch<CategoriaDto[]>(EP.categorias),
    apiFetch<TallaDto[]>(EP.tallas),
    usuarioId ? apiFetch<CarritoDto>(EP.carrito(usuarioId)) : Promise.resolve(null),
  ]);
  return {
    sucursales, productos, inventario, categorias, tallas,
    carrito: usuarioId && carrito ? { usuarioId, dto: carrito } : null,
  };
}
