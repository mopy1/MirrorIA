import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import * as React from 'react';
import { ApiError } from '@/lib/api/errores';
import { comprarReserva } from '../api/reservas.api';

/**
 * "Comprar lo que reservé" (M3.3, H7): crea la venta PENDIENTE de la reserva `EN_TIENDA` y abre el
 * mismo pago que el checkout. Solo con red. Un intento = una `Idempotency-Key` (un reintento tras
 * un corte reusa la clave y no duplica la venta); se renueva tras una respuesta del servidor.
 */
export function useComprarReserva(reservaId: string | undefined) {
  const qc = useQueryClient();
  const clave = React.useRef<string | null>(null);
  return useMutation({
    mutationFn: (codigoCupon?: string) => {
      clave.current ??= Crypto.randomUUID();
      return comprarReserva(reservaId!, clave.current, codigoCupon);
    },
    onSuccess: (venta) => {
      clave.current = null;
      void qc.invalidateQueries({ queryKey: ['ventas'] });
      router.push({ pathname: '/mis-cosas/pago/[ventaId]', params: { ventaId: venta.id } });
    },
    onError: (e) => {
      if (e instanceof ApiError) clave.current = null;
      // 409 "ya hay una compra pendiente": al refrescar, el pase ofrece "Pagar mi compra".
      void qc.invalidateQueries({ queryKey: ['ventas'] });
      void qc.invalidateQueries({ queryKey: ['reservas'] });
    },
  });
}
