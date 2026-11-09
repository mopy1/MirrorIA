import { router } from 'expo-router';
import { Ticket } from 'phosphor-react-native';
import { View } from 'react-native';
import { Titulo } from '@/components/common/Titulo';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useDiccionario } from '@/features/espejo/hooks/use-diccionario';
import { BadgeEstadoReserva } from '@/features/reservas/components/BadgeEstadoReserva';
import { fechaCortaLaPaz } from '@/lib/formato/fechas';

/** Tarjeta de la próxima cita con la acción primaria del dashboard: "Ver mi pase". */
export function ProximaCita({ reserva }: { reserva: { id: string; estado: string; fechaHoraPrevista: string; sucursalId?: string } }) {
  const dic = useDiccionario().data;
  const sucursal = reserva.sucursalId ? dic?.sucursales.get(reserva.sucursalId)?.nombre : undefined;
  return (
    <View className="mx-5 gap-3 rounded-xl bg-primary/10 p-4">
      <View className="flex-row items-start gap-3">
        <Icon as={Ticket} size={24} weight="duotone" className="text-primary" />
        <View className="flex-1 gap-1">
          <Text className="text-xs uppercase tracking-wider text-muted-foreground">Tu próxima cita</Text>
          <Titulo nivel="h3">{fechaCortaLaPaz(Date.parse(reserva.fechaHoraPrevista))}</Titulo>
          {sucursal ? <Text className="text-sm text-muted-foreground">{sucursal}</Text> : null}
        </View>
        <BadgeEstadoReserva estado={reserva.estado} />
      </View>
      <Button onPress={() => router.push({ pathname: '/mis-cosas/reservas/[reservaId]', params: { reservaId: reserva.id } })}>
        <Text>{reserva.estado === 'EN_TIENDA' ? 'Comprar lo que reservé' : 'Ver mi pase'}</Text>
      </Button>
    </View>
  );
}
