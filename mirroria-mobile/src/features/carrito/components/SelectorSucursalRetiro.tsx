import { View } from 'react-native';
import { FilaOpcion } from '@/components/common/FilaOpcion';
import { Text } from '@/components/ui/text';
import type { OpcionRetiro } from '../hooks/use-checkout';

interface Props {
  opciones: OpcionRetiro[];
  elegida: string | null;
  onElegir: (id: string) => void;
}

/** Dónde retirar: según el stock libre del espejo (descontado lo que ya está en la outbox). */
export function SelectorSucursalRetiro({ opciones, elegida, onElegir }: Props) {
  if (opciones.length === 0) return <Text className="text-sm text-muted-foreground">No hay sucursales guardadas: sincronizá con red una vez.</Text>;
  return (
    <View className="gap-2">
      {opciones.map((o) => {
        const ok = o.faltan.length === 0;
        return (
          <FilaOpcion
            key={o.sucursalId}
            titulo={o.nombre}
            detalle={o.ciudad}
            nota={ok ? 'Tiene todo' : `Sin ${o.faltan.join(', ')}`}
            notaClase={ok ? 'text-success font-body-semibold' : 'text-danger'}
            elegida={o.sucursalId === elegida}
            deshabilitada={!ok}
            onPress={() => onElegir(o.sucursalId)}
          />
        );
      })}
    </View>
  );
}
