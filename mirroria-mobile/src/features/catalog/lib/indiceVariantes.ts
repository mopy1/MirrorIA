import { catalogApi } from '../api/catalogApi';
import type { ProductoResponseDto, VarianteResponseDto } from '../types/catalog.types';

export interface VarianteConProducto {
  variante: VarianteResponseDto;
  producto: ProductoResponseDto;
}

const VIGENCIA_MS = 5 * 60 * 1000;
let cache: { at: number; promesa: Promise<Map<string, VarianteConProducto>> } | null = null;

/**
 * varianteId → {variante, producto}. El carrito del backend solo guarda
 * `{varianteId, cantidad}` y el listado `GET /catalogo/productos` NO trae
 * variantes (solo el detalle por producto las trae) — buscarlas en el listado
 * dejaba el carrito siempre vacío. Mismo cruce que la web
 * (`useVariantesConProducto`), pero cacheado 5 min: son N pedidos de detalle
 * y en el celular no conviene repetirlos cada vez que se abre el carrito.
 */
export function indiceVariantes(): Promise<Map<string, VarianteConProducto>> {
  if (cache && Date.now() - cache.at < VIGENCIA_MS) return cache.promesa;

  const promesa = catalogApi.getProductos().then(async (productos) => {
    const detalles = await Promise.all(
      productos.map((p) => catalogApi.getProducto(p.id).catch(() => null))
    );
    const indice = new Map<string, VarianteConProducto>();
    for (const producto of detalles) {
      for (const variante of producto?.variantes ?? []) {
        indice.set(variante.id, { variante, producto: producto! });
      }
    }
    return indice;
  });

  cache = { at: Date.now(), promesa };
  promesa.catch(() => (cache = null));
  return promesa;
}
