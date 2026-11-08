import { View } from 'react-native';
import { FilaOpcion } from '@/components/common/FilaOpcion';
import { Text } from '@/components/ui/text';
import type { SucursalReservable } from '@/lib/db/repos/reservas.repo';

interface Props {
  sucursales: SucursalReservable[];
  elegida: string | null;
  onElegir: (id: string) => void;
}

/** Dónde probarse: solo se puede apartar hasta la mitad del stock de la sucursal (regla del backend). */
export function SelectorSucursalReserva({ sucursales, elegida, onElegir }: Props) {
  if (sucursales.length === 0) return <Text className="text-sm text-muted-foreground">No hay sucursales guardadas: sincronizá con red una vez.</Text>;
  return (
    <View className="gap-2">
      {sucursales.map((s) => (
        <FilaOpcion
          key={s.sucursalId}
          titulo={s.nombre}
          detalle={s.ciudad}
          nota={s.reservable > 0 ? `${s.libre} disponibles` : s.libre > 0 ? 'Solo para comprar' : 'Agotada'}
          notaClase={s.reservable > 0 ? 'text-success font-body-semibold' : 'text-danger'}
          elegida={s.sucursalId === elegida}
          deshabilitada={s.reservable <= 0}
          onPress={() => onElegir(s.sucursalId)}
        />
      ))}
    </View>
  );
}
