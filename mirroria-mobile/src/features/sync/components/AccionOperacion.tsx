import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { formatoBs } from '@/lib/formato/dinero';
import { conflictosStore } from '@/lib/outbox/conflictos-store';
import { OutboxManager } from '@/lib/outbox/outbox-manager';
import type { DetalleConflicto, FilaOutbox } from '@/lib/outbox/tipos';
import { useEstadoRed } from '@/lib/red/use-estado-red';

/** La única acción primaria del comprobante según el estado (pegada abajo, zona del pulgar). */
export function AccionOperacion({ fila }: { fila: FilaOutbox }) {
  const insets = useSafeAreaInsets();
  const red = useEstadoRed();
  const r = fila.respuesta ?? {};
  let texto = 'Ir a la vitrina';
  let nota: string | null = null;
  let deshabilitado = false;
  let accion = () => router.navigate('/vitrina');

  if (fila.estado === 'PENDIENTE' || fila.estado === 'ENVIANDO') {
    texto = 'Sincronizar ahora';
    deshabilitado = !red.online || fila.estado === 'ENVIANDO';
    nota = red.online ? null : 'Sin conexión: se envía sola cuando vuelva la red.';
    accion = () => void OutboxManager.procesarCola(true);
  } else if (fila.estado === 'CONFIRMADA' && fila.tipo === 'CHECKOUT' && typeof r.id === 'string') {
    const total = typeof r.totalCents === 'number' ? r.totalCents : (fila.meta.totalCents ?? 0);
    texto = `Pagar ${formatoBs(total)}`;
    nota = 'El pago necesita conexión (nunca se paga sin red).';
    accion = () => router.push({ pathname: '/carrito/pago/[ventaId]', params: { ventaId: r.id as string, total: String(total) } });
  } else if (fila.estado === 'CONFIRMADA' && fila.tipo === 'RESERVA_CREAR' && typeof r.id === 'string') {
    texto = 'Ver mi pase de tienda';
    accion = () => router.navigate({ pathname: '/mis-cosas/reservas/[reservaId]', params: { reservaId: r.id as string } });
  } else if (fila.estado === 'COMPENSADA') {
    texto = 'Ver alternativas';
    accion = () => conflictosStore.abrir({ fila, detalle: (r.detalles ?? {}) as DetalleConflicto });
  } else if (fila.tipo !== 'RESERVA_CREAR') {
    texto = 'Ir al carrito';
    accion = () => router.navigate('/carrito');
  }

  return (
    <View className="border-t border-border bg-background px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <Button size="lg" className="h-[52px]" disabled={deshabilitado} onPress={accion}>
        <Text>{texto}</Text>
      </Button>
      {nota ? <Text className="mt-2 text-center text-xs text-muted-foreground">{nota}</Text> : null}
    </View>
  );
}
