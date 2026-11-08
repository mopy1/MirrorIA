import { useMutation } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { apiFetch } from '@/lib/api/cliente-http';
import { EP } from '@/lib/api/endpoints';
import { conflictosStore, type ConflictoAbierto } from '@/lib/outbox/conflictos-store';
import { encolarAgregarCarrito, encolarCheckout } from '@/lib/outbox/operaciones';
import { itemsDe } from '@/lib/outbox/repo-outbox';
import { sqlOutbox } from '@/lib/outbox/sql-expo';

/**
 * Transacción compensatoria (CU11, spec §5.6). El checkout se anuló entero en el servidor y el
 * carrito sigue con sus prendas: las alternativas son operaciones NUEVAS (clave nueva).
 */
export function useResolverConflicto(c: ConflictoAbierto | null) {
  const retirarEn = useMutation({
    networkMode: 'always',
    mutationFn: async (s: { sucursalId: string; sucursalNombre?: string }) => {
      const { fila } = c!;
      const items = await itemsDe(await sqlOutbox(), fila.id);
      const cupon = typeof fila.payload.codigoCupon === 'string' ? fila.payload.codigoCupon : undefined;
      return encolarCheckout({
        tenantId: fila.tenantId, usuarioId: fila.usuarioId, sucursalId: s.sucursalId, codigoCupon: cupon,
        items: items.map((i) => ({ varianteId: i.varianteId, cantidad: i.cantidad })),
        meta: { ...fila.meta, sucursalNombre: s.sucursalNombre ?? 'otra sucursal' },
      });
    },
    onSuccess: (nueva) => {
      conflictosStore.cerrar();
      router.push({ pathname: '/carrito/compra/[outboxId]', params: { outboxId: nueva.id } });
    },
  });

  /** Con red: quita la talla agotada del carrito, agrega la otra y vuelve al checkout. */
  const cambiarTalla = useMutation({
    mutationFn: async (t: { varianteId: string; talla?: string }) => {
      const { fila, detalle } = c!;
      if (detalle.varianteId) {
        await apiFetch(`${EP.carrito(fila.usuarioId)}/items/${detalle.varianteId}`, { metodo: 'DELETE', idempotencyKey: Crypto.randomUUID() });
      }
      await encolarAgregarCarrito({
        tenantId: fila.tenantId, usuarioId: fila.usuarioId, varianteId: t.varianteId,
        meta: { prenda: detalle.prendaNombre, talla: t.talla, color: detalle.color },
      });
    },
    onSuccess: () => {
      conflictosStore.cerrar();
      router.push('/carrito/checkout');
    },
  });

  return { retirarEn, cambiarTalla };
}
