import { useState } from 'react';
import { ApiError } from '@/src/lib/api';
import { storage } from '@/src/lib/storage';
import { tiendaActual } from '@/src/lib/tienda';
import { catalogoAdminApi } from '../api/catalogoAdminApi';
import { claveInactivas, conId, leerIds, sinId } from '../lib/prendas-inactivas';

async function recordar(id: string, inactiva: boolean) {
  const clave = claveInactivas(tiendaActual());
  const ids = leerIds(await storage.getItem(clave));
  await storage.setItem(clave, JSON.stringify(inactiva ? conId(ids, id) : sinId(ids, id)));
}

/**
 * Activar / desactivar una prenda (PATCH { activo }). Reactivar vuelve a ocupar
 * un lugar del plan: si no hay cupo, el backend responde 409 y se muestra su mensaje.
 */
export function useActivarPrenda(onListo: () => void) {
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cambiar(id: string, activo: boolean) {
    setOcupado(id);
    setError(null);
    try {
      await catalogoAdminApi.updateProducto(id, { activo });
      await recordar(id, !activo);
      onListo();
      return true;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cambiar el estado de la prenda');
      return false;
    } finally {
      setOcupado(null);
    }
  }

  return { cambiar, ocupado, error, limpiarError: () => setError(null) };
}
