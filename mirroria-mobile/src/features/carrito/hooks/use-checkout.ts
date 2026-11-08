import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import { useSesion } from '@/contexts/SesionContext';
import { useTienda } from '@/contexts/TiendaContext';
import { stockParaRetiro } from '@/lib/db/repos/carrito.repo';
import { encolarCheckout } from '@/lib/outbox/operaciones';
import { useCarritoLocal } from './use-carrito-local';

export interface OpcionRetiro {
  sucursalId: string;
  nombre: string;
  ciudad: string;
  /** Prendas del carrito sin stock libre ahí (según el espejo). */
  faltan: string[];
}

/** Checkout (spec §3.2 `carrito/checkout`): sucursal de retiro + cupón → `CHECKOUT` encolado. */
export function useCheckout() {
  const { tienda } = useTienda();
  const { sesion } = useSesion();
  const carrito = useCarritoLocal();
  const items = React.useMemo(() => carrito.data ?? [], [carrito.data]);
  const [elegida, setElegida] = React.useState<string | null>(null);
  const [cupon, setCupon] = React.useState<{ codigo: string; descuentoCents: number } | null>(null);

  const stock = useQuery({
    queryKey: ['vitrina', 'retiro', tienda?.id, items.map((i) => `${i.varianteId}:${i.cantidad}`).join(',')],
    enabled: !!tienda && items.length > 0,
    networkMode: 'always',
    queryFn: () => stockParaRetiro(tienda!.id, items.map((i) => i.varianteId)),
  });

  const opciones = React.useMemo<OpcionRetiro[]>(() => {
    const porSucursal = new Map<string, OpcionRetiro>();
    for (const s of stock.data ?? []) {
      const o = porSucursal.get(s.sucursal_id) ?? { sucursalId: s.sucursal_id, nombre: s.nombre, ciudad: s.ciudad, faltan: [] };
      const item = items.find((i) => i.varianteId === s.variante_id);
      if (item && s.libre < item.cantidad) o.faltan.push(`${item.nombre} ${item.talla}`);
      porSucursal.set(s.sucursal_id, o);
    }
    return [...porSucursal.values()];
  }, [stock.data, items]);

  const sucursal = opciones.find((o) => o.sucursalId === elegida) ?? opciones.find((o) => o.faltan.length === 0) ?? null;
  const subtotal = items.reduce((s, i) => s + i.precioCents * i.cantidad, 0);
  const total = Math.max(subtotal - (cupon?.descuentoCents ?? 0), 0);

  const confirmar = useMutation({
    networkMode: 'always',
    mutationFn: () =>
      encolarCheckout({
        tenantId: tienda!.id, usuarioId: sesion!.usuario.id, sucursalId: sucursal!.sucursalId, codigoCupon: cupon?.codigo,
        items: items.map((i) => ({ varianteId: i.varianteId, cantidad: i.cantidad })),
        meta: {
          sucursalNombre: sucursal!.nombre, totalCents: total, codigoCupon: cupon?.codigo,
          lineas: items.map((i) => ({ prenda: i.nombre, talla: i.talla, color: i.color, cantidad: i.cantidad, precioCents: i.precioCents })),
        },
      }),
    onSuccess: (f) => router.replace({ pathname: '/carrito/compra/[outboxId]', params: { outboxId: f.id } }),
  });

  return { carrito, items, opciones, sucursal, elegir: setElegida, cupon, setCupon, subtotal, total, confirmar };
}
