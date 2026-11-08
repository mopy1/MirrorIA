import { Info, WarningCircle } from 'phosphor-react-native';
import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { CupoReservas } from '../api/reservas.api';

interface Props {
  cupo: CupoReservas | null | undefined;
  encoladas: number;
  guardado: boolean;
  sinCupo: boolean;
}

/** Reglas visibles antes de reservar: cupo X de Y, prendas, ventana horaria y tolerancia. */
export function ReglasReserva({ cupo, encoladas, guardado, sinCupo }: Props) {
  const max = cupo?.maxReservasActivas ?? 2;
  const activas = (cupo?.reservasActivas ?? 0) + encoladas;
  return (
    <View className={sinCupo ? 'gap-2 rounded-lg bg-danger/10 p-4' : 'gap-2 rounded-lg bg-muted/60 p-4'}>
      <View className="flex-row items-center gap-2">
        <Icon as={sinCupo ? WarningCircle : Info} size={18} weight="duotone" className={sinCupo ? 'text-danger' : 'text-primary'} />
        <Text className="font-body-semibold text-sm">
          Reservas activas <Text className="font-mono text-sm">{activas} de {max}</Text>
          {encoladas ? ` (${encoladas} sin confirmar)` : ''}
        </Text>
      </View>
      {sinCupo ? <Text className="text-xs leading-4 text-danger">{cupo?.motivo ?? `Ya tenés ${max} reservas activas: esperá a que se cierre una.`}</Text> : null}
      <Text className="text-xs leading-4 text-muted-foreground">
        Hasta {cupo?.maxPrendasPorReserva ?? 3} prendas por reserva, {cupo?.maxUnidadesPorVariante ?? 1} por talla. Entre {cupo?.anticipacionMinimaMinutos ?? 30} min y{' '}
        {cupo?.ventanaMaximaHoras ?? 48} h desde ahora; te esperamos {cupo?.toleranciaMinutos ?? 30} min.
        {guardado ? (cupo ? ' Cupo guardado: la tienda lo confirma al volver la red.' : ' Sin red: la tienda revisa tu cupo cuando se envíe.') : ''}
      </Text>
    </View>
  );
}
