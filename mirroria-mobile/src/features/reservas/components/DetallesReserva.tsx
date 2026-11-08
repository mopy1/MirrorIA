import { CalendarBlank, MapPin, TShirt, type Icon as PhosphorIcon } from 'phosphor-react-native';
import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Diccionario } from '@/lib/db/repos/detalle.repo';
import { fechaCortaLaPaz } from '@/lib/formato/fechas';
import type { ReservaDto } from '../api/reservas.api';

function Dato({ icono, titulo, children }: { icono: PhosphorIcon; titulo: string; children: React.ReactNode }) {
  return (
    <View className="flex-row gap-3 border-b border-border py-3.5">
      <Icon as={icono} size={20} weight="duotone" className="text-primary" />
      <View className="flex-1 gap-0.5">
        <Text className="text-xs uppercase tracking-wider text-muted-foreground">{titulo}</Text>
        {children}
      </View>
    </View>
  );
}

/** Dónde, cuándo y qué prendas (nombres del espejo, sin red también). */
export function DetallesReserva({ reserva, dic }: { reserva: ReservaDto; dic: Diccionario | undefined }) {
  const s = dic?.sucursales.get(reserva.sucursalId);
  return (
    <View>
      <Dato icono={MapPin} titulo="Sucursal">
        <Text className="font-body-medium text-[15px]">{s?.nombre ?? 'Sucursal'}</Text>
        {s?.direccion ? <Text className="text-sm text-muted-foreground">{s.direccion}</Text> : null}
      </Dato>
      <Dato icono={CalendarBlank} titulo="Tu cita">
        <Text className="font-body-medium text-[15px]">{fechaCortaLaPaz(Date.parse(reserva.fechaHoraPrevista))}</Text>
        <Text className="text-sm text-muted-foreground">Tus prendas quedan apartadas hasta 30 min después.</Text>
      </Dato>
      <Dato icono={TShirt} titulo={reserva.items.length === 1 ? 'Prenda' : 'Prendas'}>
        {reserva.items.map((i) => {
          const p = dic?.variantes.get(i.varianteId);
          return (
            <Text key={i.id} className="text-[15px]">
              {p ? `${p.prenda} · ${p.talla} · ${p.color}` : 'Prenda reservada'}
              {i.cantidad > 1 ? ` × ${i.cantidad}` : ''}
            </Text>
          );
        })}
      </Dato>
    </View>
  );
}
