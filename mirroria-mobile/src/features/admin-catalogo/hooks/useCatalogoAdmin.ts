import { useCallback, useEffect, useState } from 'react';
import { storage } from '@/src/lib/storage';
import { tiendaActual } from '@/src/lib/tienda';
import { catalogoAdminApi } from '../api/catalogoAdminApi';
import { claveInactivas, leerIds } from '../lib/prendas-inactivas';
import type { Categoria, Coleccion, Producto, Temporada, UsoPlan } from '../types/catalogo-admin.types';

interface Estado {
  productos: Producto[];
  inactivas: Producto[];
  categorias: Categoria[];
  colecciones: Coleccion[];
  temporadas: Temporada[];
  uso: UsoPlan | null;
}

const VACIO: Estado = { productos: [], inactivas: [], categorias: [], colecciones: [], temporadas: [], uso: null };

/** Trae las prendas desactivadas que este teléfono recuerda (las que ya no existen se descartan). */
async function cargarInactivas(): Promise<Producto[]> {
  const ids = leerIds(await storage.getItem(claveInactivas(tiendaActual())));
  const res = await Promise.all(ids.map((id) => catalogoAdminApi.getProducto(id).catch(() => null)));
  return res.filter((p): p is Producto => !!p && !p.activo);
}

/** Todo lo que necesita la pantalla de catálogo del panel, con recarga. */
export function useCatalogoAdmin(habilitado: boolean) {
  const [estado, setEstado] = useState<Estado>(VACIO);
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (esRecarga = false) => {
    if (esRecarga) setRecargando(true);
    else setCargando(true);
    setError(null);
    try {
      const [productos, categorias, colecciones, temporadas, uso, inactivas] = await Promise.all([
        catalogoAdminApi.getProductos(),
        catalogoAdminApi.getCategorias(),
        catalogoAdminApi.getColecciones(),
        catalogoAdminApi.getTemporadas(),
        catalogoAdminApi.getUsoPlan().catch(() => null),
        cargarInactivas(),
      ]);
      setEstado({ productos, categorias, colecciones, temporadas, uso, inactivas });
    } catch {
      setError('No se pudo cargar el catálogo');
    } finally {
      setCargando(false);
      setRecargando(false);
    }
  }, []);

  useEffect(() => {
    if (habilitado) cargar();
  }, [habilitado, cargar]);

  return { ...estado, cargando, recargando, error, recargar: () => cargar(true) };
}
