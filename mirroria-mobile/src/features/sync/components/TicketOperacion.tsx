import { CalendarCheck, Receipt, ShoppingBag, type Icon as PhosphorIcon } from 'phosphor-react-native';
import { View } from 'react-native';
import { BadgeEstadoOutbox } from '@/components/common/BadgeEstadoOutbox';
import { MonedaBs } from '@/components/common/MonedaBs';
import { Titulo } from '@/components/common/Titulo';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { codigoCorto } from '@/lib/outbox/consultas';
import type { FilaOutbox, TipoOperacion } from '@/lib/outbox/tipos';

const CABECERA: Record<TipoOperacion, { titulo: string; icono: PhosphorIcon }> = {
  CHECKOUT: { titulo: 'Tu compra', icono: Receipt },
  RESERVA_CREAR: { titulo: 'Tu reserva para probarte', icono: CalendarCheck },
  CARRITO_AGREGAR: { titulo: 'Agregar al carrito', icono: ShoppingBag },
};

/** RN09 en palabras: nunca "comprado" hasta que el servidor concilia. */
function explicacion(f: FilaOutbox): string {
  if (f.estado === 'PENDIENTE' || f.estado === 'ENVIANDO') return 'Todavía no está hecha: la tienda la confirma cuando vuelva la red. No se cobró nada.';
  if (f.estado === 'COMPENSADA') return 'Otra clienta se llevó la última unidad antes de que llegara tu pedido. No se te cobró nada.';
  if (f.estado === 'RECHAZADA') return f.ultimoError ?? 'La tienda no la aceptó.';
  if (f.tipo === 'CHECKOUT') return 'La tienda apartó tus prendas. Falta pagar para retirarlas.';
  return f.tipo === 'RESERVA_CREAR' ? 'Tu prenda te espera apartada en la sucursal.' : 'La prenda ya está en tu carrito.';
}

/** Comprobante tipo recibo (borde punteado, montos en mono) de una operación de la outbox. */
export function TicketOperacion({ fila }: { fila: FilaOutbox }) {
  const c = CABECERA[fila.tipo];
  const m = fila.meta;
  const ventaId = typeof fila.respuesta?.id === 'string' ? fila.respuesta.id : null;
  const confirmadaTexto = fila.estado === 'CONFIRMADA' && ventaId ? `Confirmada · ${codigoCorto(ventaId)}${fila.tipo === 'CHECKOUT' ? ' · falta pagar' : ''}` : undefined;
  return (
    <View className="mx-5 rounded-lg border border-dashed border-border bg-card p-5">
      <View className="mb-3 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Icon as={c.icono} size={20} weight="duotone" className="text-primary" />
        </View>
        <Titulo nivel="h2" className="flex-1">
          {c.titulo}
        </Titulo>
      </View>
      <BadgeEstadoOutbox estado={fila.estado} texto={confirmadaTexto} />
      <Text className="mt-2 text-sm leading-5 text-muted-foreground">{explicacion(fila)}</Text>
      <View className="mt-4 gap-2 border-t border-dashed border-border pt-4">
        {(m.lineas ?? (m.prenda ? [{ prenda: m.prenda, talla: m.talla ?? '', color: m.color ?? '', cantidad: 1, precioCents: 0 }] : [])).map((l, i) => (
          <View key={i} className="flex-row justify-between gap-3">
            <Text className="flex-1 text-sm" numberOfLines={1}>
              {l.prenda} · {l.talla} · {l.color} {l.cantidad > 1 ? `× ${l.cantidad}` : ''}
            </Text>
            {l.precioCents ? <MonedaBs cents={l.precioCents * l.cantidad} /> : null}
          </View>
        ))}
        {m.sucursalNombre ? <Text className="text-xs text-muted-foreground">{fila.tipo === 'CHECKOUT' ? 'Retiro en' : 'Sucursal'} {m.sucursalNombre}</Text> : null}
        {m.fechaHora ? <Text className="text-xs text-muted-foreground">Para el {m.fechaHora}</Text> : null}
      </View>
      {m.totalCents !== undefined ? (
        <View className="mt-3 flex-row items-baseline justify-between border-t border-dashed border-border pt-3">
          <Text className="font-body-semibold text-sm">Total</Text>
          <MonedaBs cents={typeof fila.respuesta?.totalCents === 'number' ? fila.respuesta.totalCents : m.totalCents} className="text-xl" />
        </View>
      ) : null}
    </View>
  );
}
