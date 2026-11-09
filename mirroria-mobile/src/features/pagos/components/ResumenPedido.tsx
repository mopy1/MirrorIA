import { View } from 'react-native';
import { MonedaBs } from '@/components/common/MonedaBs';
import { Text } from '@/components/ui/text';
import { LineasCompra } from '@/features/carrito/components/LineasCompra';
import type { Diccionario } from '@/lib/db/repos/detalle.repo';
import { formatoBs } from '@/lib/formato/dinero';
import { codigoCorto } from '@/lib/outbox/consultas';
import { ventaPagada } from '@/lib/pagos/estado-pago';
import type { VentaDto } from '../api/pagos.api';

/** Recibo del pedido: código, prendas (nombres del espejo), subtotal, cupón y total. */
export function ResumenPedido({ venta, dic }: { venta: VentaDto; dic: Diccionario | undefined }) {
  const lineas = venta.items.map((i) => {
    const p = dic?.variantes.get(i.varianteId);
    return { prenda: p?.prenda ?? 'Prenda', talla: p?.talla ?? '—', color: p?.color ?? '—', cantidad: i.cantidad, precioCents: i.precioUnitCents };
  });
  const sucursal = dic?.sucursales.get(venta.sucursalId)?.nombre;
  return (
    <View className="rounded-lg border border-dashed border-border bg-card px-5 pb-4 pt-5">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-xs uppercase tracking-wider text-muted-foreground">{venta.reservaId ? 'Lo que reservaste' : 'Pedido'}</Text>
        <Text className="font-mono text-base" selectable>
          {venta.numeroComprobante ?? codigoCorto(venta.id)}
        </Text>
      </View>
      {sucursal ? <Text className="mt-0.5 text-xs text-muted-foreground">Retiro en {sucursal}</Text> : null}
      <View className="mt-2">
        <LineasCompra lineas={lineas} />
      </View>
      {venta.descuentoCents > 0 ? (
        <View className="mt-3 gap-1">
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted-foreground">Subtotal</Text>
            <MonedaBs cents={venta.subtotalCents} className="text-muted-foreground" />
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-success">Cupón</Text>
            <Text className="font-mono text-sm text-success">−{formatoBs(venta.descuentoCents)}</Text>
          </View>
        </View>
      ) : null}
      <View className="mt-3 flex-row items-baseline justify-between">
        <Text className="font-body-semibold text-sm">{ventaPagada(venta.estado) ? 'Pagado' : venta.estado === 'PENDIENTE' ? 'A pagar' : 'Total'}</Text>
        <MonedaBs cents={venta.totalCents} className="text-2xl" />
      </View>
    </View>
  );
}
