import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { Pantalla } from '@/components/common/Pantalla';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useTema } from '@/contexts/TemaContext';
import { mensajeDeError } from '@/lib/api/errores';
import { useEstadoRed } from '@/lib/red/use-estado-red';
import { ReglasReserva } from '../components/ReglasReserva';
import { SelectorHorario } from '../components/SelectorHorario';
import { SelectorSucursalReserva } from '../components/SelectorSucursalReserva';
import { useReservar } from '../hooks/use-reservar';

const Seccion = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <View className="gap-3">
    <Text className="font-body-semibold text-xs uppercase tracking-wider text-muted-foreground">{titulo}</Text>
    {children}
  </View>
);

/** `vitrina/[productoId]/reservar` (CU09/CU10): reservar para probarme, también sin red (queda pendiente). */
export default function ReservarScreen() {
  const { productoId, variante } = useLocalSearchParams<{ productoId: string; variante?: string }>();
  const r = useReservar(productoId, variante || undefined);
  const red = useEstadoRed();
  const insets = useSafeAreaInsets();
  const { colores } = useTema();
  const listo = !!r.elegida && !!r.horario && !r.sinCupo;

  return (
    <Pantalla>
      <EncabezadoPantalla titulo="Reservar para probarme" respaldo={`/vitrina/${productoId}`} />
      {r.ficha.isPending || !r.variante ? (
        <View className="gap-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</View>
      ) : (
        <ScrollView contentContainerClassName="gap-7 px-5 pb-8 pt-2">
          <View>
            <Text className="font-body-semibold text-base">{r.ficha.data?.producto.titulo}</Text>
            <Text className="text-sm text-muted-foreground">Talla {r.variante.talla} · {r.variante.color} · 1 unidad</Text>
          </View>
          <ReglasReserva cupo={r.cupo.data?.cupo} encoladas={r.encoladas} guardado={!!r.cupo.data?.guardado} sinCupo={r.sinCupo} />
          <Seccion titulo="Sucursal">
            <SelectorSucursalReserva sucursales={r.sucursales.data ?? []} elegida={r.elegida?.sucursalId ?? null} onElegir={r.elegirSucursal} />
          </Seccion>
          <Seccion titulo="¿Cuándo venís?">
            <SelectorHorario horarios={r.horarios} elegido={r.horario} onElegir={r.setHorario} />
          </Seccion>
          {r.reservar.error ? <Text className="text-sm text-danger">{mensajeDeError(r.reservar.error)}</Text> : null}
        </ScrollView>
      )}
      <View className="border-t border-border bg-background px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <Button size="lg" className="h-[52px]" disabled={!listo || r.reservar.isPending} onPress={() => r.reservar.mutate()}>
          {r.reservar.isPending ? <ActivityIndicator color={colores['primary-foreground']} /> : null}
          <Text>{r.horario ? `Reservar · ${r.horario.dia.toLowerCase()} ${r.horario.hora}` : 'Elegí un horario'}</Text>
        </Button>
        <Text className="mt-2 text-center text-xs text-muted-foreground">
          {red.online ? 'La prenda te espera apartada; no pagás nada por reservar.' : 'Sin conexión: la reserva queda “Pendiente de confirmar” y se envía sola.'}
        </Text>
      </View>
    </Pantalla>
  );
}
