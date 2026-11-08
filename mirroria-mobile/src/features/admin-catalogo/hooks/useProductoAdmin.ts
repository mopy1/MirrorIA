import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/src/lib/api';
import { catalogoAdminApi } from '../api/catalogoAdminApi';
import type { Categoria, Coleccion, Color, Producto, Talla, Temporada } from '../types/catalogo-admin.types';

interface Datos {
  producto: Producto | null;
  categorias: Categoria[];
  colecciones: Coleccion[];
  temporadas: Temporada[];
  tallas: Talla[];
  colores: Color[];
}

/** Ficha de una prenda con variantes + los catálogos para editarla. */
export function useProductoAdmin(id: string | undefined, habilitado: boolean) {
  const [datos, setDatos] = useState<Datos>({ producto: null, categorias: [], colecciones: [], temporadas: [], tallas: [], colores: [] });
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (esRecarga = false) => {
    if (!id) return;
    if (esRecarga) setRecargando(true);
    else setCargando(true);
    setError(null);
    try {
      const [producto, categorias, colecciones, temporadas, tallas, colores] = await Promise.all([
        catalogoAdminApi.getProducto(id),
        catalogoAdminApi.getCategorias(),
        catalogoAdminApi.getColecciones(),
        catalogoAdminApi.getTemporadas(),
        catalogoAdminApi.getTallas(),
        catalogoAdminApi.getColores(),
      ]);
      setDatos({ producto, categorias, colecciones, temporadas, tallas, colores });
    } catch (e) {
      setError(e instanceof ApiError && e.status === 404 ? 'Esta prenda no existe en tu tienda.' : 'No se pudo cargar la prenda');
    } finally {
      setCargando(false);
      setRecargando(false);
    }
  }, [id]);

  useEffect(() => {
    if (habilitado) cargar();
  }, [habilitado, cargar]);

  return { ...datos, cargando, recargando, error, recargar: () => cargar(true) };
}
