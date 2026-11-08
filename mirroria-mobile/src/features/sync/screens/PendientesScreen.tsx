import { CheckCircle } from 'phosphor-react-native';
import { RefreshControl, ScrollView, View } from 'react-native';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { EstadoVacio } from '@/components/common/EstadoVacio';
import { Pantalla } from '@/components/common/Pantalla';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useSesion } from '@/contexts/SesionContext';
import { useTienda } from '@/contexts/TiendaContext';
import { terminada } from '@/lib/outbox/consultas';
import { OutboxManager } from '@/lib/outbox/outbox-manager';
import type { FilaOutbox } from '@/lib/outbox/tipos';
import { useOutbox } from '@/lib/outbox/use-outbox';
import { BorrarTerminadas } from '../components/BorrarTerminadas';
import { FilaOperacion } from '../components/FilaOperacion';
import { InterruptorSinRed } from '../components/InterruptorSinRed';
import { ResumenSync } from '../components/ResumenSync';

/** Spec §3.2: problemas arriba (con color), luego lo que falta enviar, luego lo confirmado. */
const PRIORIDAD: Record<FilaOutbox['estado'], number> = { COMPENSADA: 0, RECHAZADA: 0, ENVIANDO: 1, PENDIENTE: 1, CONFIRMADA: 2 };

/** `mis-cosas/pendientes`: la outbox de la clienta, "Sincronizar ahora", modo demo "Sin red" y "Borrar terminadas". */
export default function PendientesScreen() {
  const { sesion } = useSesion();
  const { tienda } = useTienda();
  const q = useOutbox();
  const filas = [...q.mias].sort((a, b) => PRIORIDAD[a.estado] - PRIORIDAD[b.estado] || b.creadoEn - a.creadoEn);
  const terminadas = q.mias.filter(terminada).length;

  return (
    <Pantalla>
      <EncabezadoPantalla titulo="Pendientes de enviar" respaldo="/mis-cosas" />
      <ScrollView contentContainerClassName="gap-5 pb-10 pt-2" refreshControl={<RefreshControl refreshing={false} onRefresh={() => void q.refetch()} />}>
        <ResumenSync pendientes={q.pendientes} conSesion={!!sesion} />
        <InterruptorSinRed />
        {q.ajenas > 0 ? (
          <Text className="mx-5 text-xs text-muted-foreground">
            Hay {q.ajenas} {q.ajenas === 1 ? 'operación' : 'operaciones'} de otra cuenta en este teléfono: se envían cuando esa clienta inicie sesión.
          </Text>
        ) : null}
        {q.isPending ? (
          <View className="mx-5 gap-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </View>
        ) : filas.length === 0 ? (
          <EstadoVacio
            icono={CheckCircle}
            titulo="Todo enviado"
            texto="Lo que hagas sin red (agregar al carrito, comprar, reservar) espera acá y se envía solo cuando vuelva la conexión."
          />
        ) : (
          <View className="gap-3">
            {filas.map((f) => (
              <FilaOperacion key={f.id} fila={f} />
            ))}
          </View>
        )}
        <BorrarTerminadas cantidad={terminadas} onBorrar={() => tienda && sesion && void OutboxManager.borrarTerminadas(tienda.id, sesion.usuario.id)} />
      </ScrollView>
    </Pantalla>
  );
}
