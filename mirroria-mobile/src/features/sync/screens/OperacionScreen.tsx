import { router, useLocalSearchParams, usePathname, type Href } from 'expo-router';
import { Receipt } from 'phosphor-react-native';
import { ScrollView, View } from 'react-native';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { EstadoVacio } from '@/components/common/EstadoVacio';
import { Pantalla } from '@/components/common/Pantalla';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useDetalleOutbox } from '@/lib/outbox/use-outbox';
import { AccionOperacion } from '../components/AccionOperacion';
import { DatosTecnicos } from '../components/DatosTecnicos';
import { LineaTiempo } from '../components/LineaTiempo';
import { TicketOperacion } from '../components/TicketOperacion';

const respaldoDe = (ruta: string): Href => (ruta.startsWith('/carrito') ? '/carrito' : ruta.startsWith('/vitrina') ? '/vitrina' : '/mis-cosas/pendientes');

/**
 * Comprobante de una operación encolada (`carrito/compra/[id]`, `vitrina/reserva/[id]`,
 * `mis-cosas/pendientes/[id]`): ticket RN09, acción según el estado, línea de tiempo y datos de idempotencia.
 */
export default function OperacionScreen() {
  const { outboxId } = useLocalSearchParams<{ outboxId: string }>();
  const respaldo = respaldoDe(usePathname());
  const q = useDetalleOutbox(outboxId);

  if (q.isPending || !q.data) {
    return (
      <Pantalla>
        <EncabezadoPantalla titulo="Comprobante" respaldo={respaldo} />
        {q.isPending ? (
          <View className="gap-4 p-5">
            <Skeleton className="h-64" />
            <Skeleton className="h-32" />
          </View>
        ) : (
          <EstadoVacio icono={Receipt} titulo="Ya no está en este teléfono" texto="Puede que hayas borrado las operaciones terminadas.">
            <Button onPress={() => router.navigate('/mis-cosas/pendientes')}>
              <Text>Ver pendientes</Text>
            </Button>
          </EstadoVacio>
        )}
      </Pantalla>
    );
  }

  const { fila, eventos } = q.data;
  return (
    <Pantalla>
      <EncabezadoPantalla titulo="Comprobante" respaldo={respaldo} />
      <ScrollView contentContainerClassName="gap-6 pb-8 pt-2">
        <TicketOperacion fila={fila} />
        <View className="gap-3 px-5">
          <Text className="font-body-semibold text-xs uppercase tracking-wider text-muted-foreground">Línea de tiempo</Text>
          <LineaTiempo eventos={eventos} />
        </View>
        <DatosTecnicos fila={fila} />
      </ScrollView>
      <AccionOperacion fila={fila} />
    </Pantalla>
  );
}
