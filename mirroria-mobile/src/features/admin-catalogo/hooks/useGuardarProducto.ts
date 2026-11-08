import { useState } from 'react';
import { ApiError } from '@/src/lib/api';
import { catalogoAdminApi } from '../api/catalogoAdminApi';
import { armarPayloadProducto, type ProductoFormValues } from '../lib/producto-form';
import type { Producto } from '../types/catalogo-admin.types';

/** Alta (POST) o edición (PATCH) de una prenda; el error es el `message` del backend (incluido el 409 del plan). */
export function useGuardarProducto() {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(valores: ProductoFormValues, original?: Producto): Promise<Producto | null> {
    setGuardando(true);
    setError(null);
    try {
      const dto = armarPayloadProducto(valores, original);
      return original
        ? await catalogoAdminApi.updateProducto(original.id, dto)
        : await catalogoAdminApi.createProducto(dto);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : original ? 'Error al actualizar la prenda' : 'No se pudo crear la prenda');
      return null;
    } finally {
      setGuardando(false);
    }
  }

  return { guardar, guardando, error, limpiarError: () => setError(null) };
}
