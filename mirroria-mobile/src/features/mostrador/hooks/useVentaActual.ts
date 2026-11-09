import { useCallback, useMemo, useState } from 'react';
import type { Reserva } from '@/src/features/staff/types/staff.types';
import { codigoCorto } from '@/src/features/staff/lib/codigo';
import {
  agregarLinea, disponibleLocal, quitarLinea, restarLinea, type ClientaVenta, type ItemMostrador, type LineaVenta,
} from '../lib/venta-caja';

/** El carrito de la caja: líneas, la reserva que se cobra (si hay) y cuánto queda de cada prenda. */
export function useVentaActual(catalogo: ItemMostrador[], vendido: Record<string, number>) {
  const [lineas, setLineas] = useState<LineaVenta[]>([]);
  const [clienta, setClienta] = useState<ClientaVenta | null>(null);
  const [apartado, setApartado] = useState<Record<string, number>>({});

  const disponible = useCallback((item: ItemMostrador) => disponibleLocal(item, vendido, apartado), [vendido, apartado]);
  const porId = useMemo(() => new Map(catalogo.map((i) => [i.varianteId, i])), [catalogo]);
  const maximo = useCallback((id: string) => {
    const item = porId.get(id);
    return item ? disponible(item) : 0;
  }, [porId, disponible]);

  const agregar = (item: ItemMostrador) => setLineas((l) => agregarLinea(l, item, disponible(item)));
  const restar = (id: string) => setLineas((l) => restarLinea(l, id));
  const quitar = (id: string) => setLineas((l) => quitarLinea(l, id));
  const enVenta = (id: string) => lineas.find((l) => l.item.varianteId === id)?.cantidad ?? 0;

  /** Carga las prendas apartadas de la reserva; devuelve cuántas ya no están en el catálogo. */
  function cobrarReserva(r: Reserva): number {
    const sep: Record<string, number> = {};
    const nuevas: LineaVenta[] = [];
    let faltan = 0;
    for (const i of r.items) {
      sep[i.varianteId] = (sep[i.varianteId] ?? 0) + i.cantidad;
      const item = porId.get(i.varianteId);
      if (item) nuevas.push({ item, cantidad: i.cantidad });
      else faltan++;
    }
    setApartado(sep);
    setLineas(nuevas);
    setClienta({ clienteId: r.clienteId, reservaId: r.id, codigo: codigoCorto(r.id) });
    return faltan;
  }

  function limpiar() {
    setLineas([]);
    setClienta(null);
    setApartado({});
  }

  return { lineas, clienta, disponible, maximo, agregar, restar, quitar, enVenta, cobrarReserva, limpiar };
}
