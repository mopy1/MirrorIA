import { useCallback, useEffect, useState } from 'react';
import { tiendaActual } from '@/src/lib/api';
import { conCatalogoLocal } from '@/src/lib/offline/catalogoLocal';
import { baseLocal } from '@/src/lib/offline/expoBase';
import { staffApi } from '@/src/features/staff/api/staffApi';
import type { Reserva } from '@/src/features/staff/types/staff.types';

/**
 * Reservas con la clienta en tienda (EN_TIENDA) de la sucursal: solo esas se pueden cobrar
 * en caja (el servidor las cierra al registrar la venta). Guardadas para usarlas sin red.
 */
export function useReservasCaja(sucursalId: string | null, enLinea: boolean) {
  const [reservas, setReservas] = useState<Reserva[]>([]);

  const cargar = useCallback(async () => {
    if (!sucursalId) return;
    try {
      const lista = await conCatalogoLocal(await baseLocal(), tiendaActual(), `caja-reservas:${sucursalId}`, () =>
        staffApi.reservas({ sucursalId, estado: 'EN_TIENDA' }),
      );
      setReservas(lista.filter((r) => r.sucursalId === sucursalId && r.estado === 'EN_TIENDA'));
    } catch {
      setReservas([]);
    }
  }, [sucursalId]);

  useEffect(() => {
    void cargar();
  }, [cargar, enLinea]);

  return { reservas, recargar: cargar };
}
