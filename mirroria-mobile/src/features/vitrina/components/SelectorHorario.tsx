import * as Haptics from 'expo-haptics';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { Horario } from '@/lib/reservas/horarios';
import { cn } from '@/lib/utils';

interface Props {
  horarios: Horario[];
  elegido: Horario | null;
  onElegir: (h: Horario) => void;
}

const Chip = ({ texto, activo, onPress, mono }: { texto: string; activo: boolean; onPress: () => void; mono?: boolean }) => (
  <Pressable
    onPress={() => {
      void Haptics.selectionAsync();
      onPress();
    }}
    accessibilityRole="button"
    accessibilityState={{ selected: activo }}
    className={cn('h-11 items-center justify-center rounded-full border px-4', activo ? 'border-primary bg-primary' : 'border-border')}
  >
    <Text className={cn(mono ? 'font-mono text-sm' : 'font-body-medium text-sm', activo && 'text-primary-foreground')}>{texto}</Text>
  </Pressable>
);

/** Día (Hoy / Mañana / Pasado mañana) y hora cada 30 min dentro de la ventana permitida. */
export function SelectorHorario({ horarios, elegido, onElegir }: Props) {
  const dias = [...new Set(horarios.map((h) => h.dia))];
  const [dia, setDia] = React.useState<string | undefined>(undefined);
  const diaActivo = dia ?? elegido?.dia ?? dias[0];
  if (horarios.length === 0) return <Text className="text-sm text-muted-foreground">No quedan horarios en la ventana de reserva.</Text>;
  return (
    <View className="gap-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {dias.map((d) => (
          <Chip key={d} texto={d} activo={d === diaActivo} onPress={() => setDia(d)} />
        ))}
      </ScrollView>
      <View className="flex-row flex-wrap gap-2">
        {horarios
          .filter((h) => h.dia === diaActivo)
          .map((h) => (
            <Chip key={h.iso} texto={h.hora} mono activo={elegido?.iso === h.iso} onPress={() => onElegir(h)} />
          ))}
      </View>
    </View>
  );
}
