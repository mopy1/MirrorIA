import { CaretRight, DeviceMobile, Globe, Storefront } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';
import { MonedaBs } from '@/components/common/MonedaBs';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { fechaCortaLaPaz } from '@/lib/formato/fechas';
import { codigoCorto } from '@/lib/outbox/consultas';
import type { VentaDto } from '@/features/pagos/api/pagos.api';
import { BadgeEstadoVenta } from './BadgeEstadoVenta';

const CANAL = { MOVIL: { icono: DeviceMobile, texto: 'App' }, WEB: { icono: Globe, texto: 'Web' }, PRESENCIAL: { icono: Storefront, texto: 'En tienda' } } as const;

/** Pedido como renglón de recibo: código, fecha, canal, prendas y total en mono. */
export function TarjetaPedido({ venta, resumen, onPress }: { venta: VentaDto; resumen: string; onPress: () => void }) {
  const canal = CANAL[venta.canal as keyof typeof CANAL] ?? CANAL.WEB;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="gap-2 rounded-lg border border-border bg-card p-4 active:bg-accent">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="font-mono text-sm">{venta.numeroComprobante ?? codigoCorto(venta.id)}</Text>
        <BadgeEstadoVenta estado={venta.estado} />
      </View>
      <Text className="font-body-medium text-[15px]" numberOfLines={1}>
        {resumen}
      </Text>
      <View className="flex-row items-center gap-2">
        <Icon as={canal.icono} size={14} className="text-muted-foreground" />
        <Text className="flex-1 text-xs text-muted-foreground">
          {canal.texto} · {fechaCortaLaPaz(Date.parse(venta.createdAt))}
          {venta.reservaId ? ' · de una reserva' : ''}
        </Text>
        <MonedaBs cents={venta.totalCents} className="text-base" />
        <Icon as={CaretRight} size={14} className="text-muted-foreground" />
      </View>
    </Pressable>
  );
}
