import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface Props {
  categorias: string[];
  activa: string | null;
  onCambiar: (c: string | null) => void;
}

/** Filtro de categorías (horizontal, chips de 40 px). */
export function ChipsCategoria({ categorias, activa, onCambiar }: Props) {
  const opciones: (string | null)[] = [null, ...categorias];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-5 py-4">
      {opciones.map((c) => {
        const sel = c === activa;
        return (
          <Pressable
            key={c ?? 'todo'}
            onPress={() => {
              void Haptics.selectionAsync();
              onCambiar(c);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: sel }}
            className={cn('h-10 justify-center rounded-full border px-4', sel ? 'border-foreground bg-foreground' : 'border-border bg-background')}
          >
            <Text className={cn('font-body-medium text-sm', sel ? 'text-background' : 'text-foreground')}>{c ?? 'Todo'}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
