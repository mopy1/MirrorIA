import { router } from 'expo-router';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTema } from '@/contexts/TemaContext';
import { mensajeDeError } from '@/lib/api/errores';
import { horaLaPaz } from '@/lib/formato/fechas';
import type { usePase } from '../hooks/use-pase';

type Pase = ReturnType<typeof usePase>;

/** Acción primaria del pase (según `accionPase`) + "Cancelar reserva" en outline. Pegado abajo. */
export function PieAccionesPase({ p, cupon }: { p: Pase; cupon: string | undefined }) {
  const insets = useSafeAreaInsets();
  const { colores } = useTema();
  const a = p.accion;
  if (!a || !p.reserva) return null;
  const rec = p.recordatorio;
  const cargando = p.comprar.isPending || rec.programar.isPending || rec.quitar.isPending;
  const error = p.comprar.error ?? rec.programar.error ?? p.cancelar.error;

  const boton = (): { texto: string; onPress: () => void } => {
    if (a.tipo === 'COMPRAR') return { texto: 'Comprar lo que reservé', onPress: () => p.comprar.mutate(cupon) };
    if (a.tipo === 'PAGAR') return { texto: 'Pagar mi compra', onPress: () => router.push({ pathname: '/mis-cosas/pago/[ventaId]', params: { ventaId: a.ventaId } }) };
    if (a.tipo === 'VER_PEDIDO') {
      const id = a.ventaId;
      return id
        ? { texto: 'Compra pagada · ver pedido', onPress: () => router.push({ pathname: '/mis-cosas/pedidos/[ventaId]', params: { ventaId: id } }) }
        : { texto: 'Ver mis pedidos', onPress: () => router.push('/mis-cosas/pedidos') };
    }
    if (rec.actual) return { texto: `Recordatorio a las ${horaLaPaz(rec.actual.en)} · quitar`, onPress: () => rec.quitar.mutate() };
    return { texto: 'Agregar recordatorio 1 h antes', onPress: () => p.programarRecordatorio() };
  };
  const { texto, onPress } = boton();
  const cancelable = p.reserva.estado === 'PENDIENTE' || p.reserva.estado === 'CONFIRMADA';
  const preguntarCancelar = () =>
    Alert.alert('¿Cancelar la reserva?', 'Las prendas vuelven a estar disponibles para otras clientas.', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => p.cancelar.mutate() },
    ]);

  return (
    <View className="gap-2 border-t border-border bg-background px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      {error ? <Text className="text-center text-sm text-danger">{mensajeDeError(error)}</Text> : null}
      {a.tipo !== 'NINGUNA' ? (
        <Button
          size="lg"
          className="h-[52px]"
          variant={a.tipo === 'RECORDATORIO' && rec.actual ? 'outline' : 'default'}
          disabled={!a.habilitado || cargando}
          onPress={onPress}
        >
          {cargando ? <ActivityIndicator color={colores['primary-foreground']} /> : null}
          <Text>{texto}</Text>
        </Button>
      ) : null}
      {a.motivo ? <Text className="text-center text-xs leading-4 text-muted-foreground">{a.motivo}</Text> : null}
      {cancelable ? (
        <Button variant="outline" disabled={!p.online || p.cancelar.isPending} onPress={preguntarCancelar}>
          <Text>{p.online ? 'Cancelar reserva' : 'Cancelar reserva (necesita conexión)'}</Text>
        </Button>
      ) : null}
    </View>
  );
}
