import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { textoSobre } from '@/lib/tema/color';
import { cn } from '@/lib/utils';

/** Iniciales de la tienda sobre su color principal (cuando no hay logo o no carga). */
export function MonogramaTienda({ nombre, color, tamano = 40, className }: { nombre: string; color: string; tamano?: number; className?: string }) {
  const iniciales = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <View
      className={cn('items-center justify-center rounded-full', className)}
      style={{ width: tamano, height: tamano, backgroundColor: color }}
    >
      <Text className="font-body-semibold" style={{ color: textoSobre(color), fontSize: tamano * 0.38 }}>
        {iniciales}
      </Text>
    </View>
  );
}
