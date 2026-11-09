import { useCallback, useRef, useState } from 'react';
import { apiFetch } from '@/src/lib/api';

interface ProductoConVariantes {
  id: string;
  titulo: string;
  variantes?: { id: string; tallaNombre: string; colorNombre: string; sku?: string }[];
}

/**
 * Nombre legible de cada variante (la venta solo trae el id). Se arma a pedido con el catálogo
 * público, una sola vez por pantalla. Lo que ya no está a la venta queda como "Prenda dada de baja".
 */
export function useNombresPrendas() {
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const pedido = useRef<Promise<void> | null>(null);

  const cargar = useCallback(() => {
    pedido.current ??= (async () => {
      try {
        const productos = await apiFetch<ProductoConVariantes[]>('/catalogo/productos');
        const detalles = await Promise.all(
          productos.map((p) => apiFetch<ProductoConVariantes>(`/catalogo/productos/${p.id}`).catch(() => p)),
        );
        const mapa: Record<string, string> = {};
        for (const p of detalles) for (const v of p.variantes ?? []) mapa[v.id] = `${p.titulo} (${v.tallaNombre}, ${v.colorNombre})`;
        setNombres(mapa);
      } catch {
        pedido.current = null;
      }
    })();
    return pedido.current;
  }, []);

  const nombre = (varianteId: string) => nombres[varianteId] ?? 'Prenda dada de baja';
  return { cargar, nombre, listo: Object.keys(nombres).length > 0 };
}
