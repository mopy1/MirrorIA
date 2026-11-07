import { router } from 'expo-router';
import { CloudSlash } from 'phosphor-react-native';
import { Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useEstadoRed } from '@/lib/red/use-estado-red';

/**
 * Banda de "sin conexión": empuja el layout (no tapa contenido) y se va con
 * animación al volver la red. Tocarla lleva a "Pendientes de enviar" (modo demo).
 */
export function BarraRed({ ultimoSync }: { ultimoSync?: string | null }) {
  const red = useEstadoRed();
  if (red.online) return null;
  const titulo = red.modoSinRed ? 'Sin conexión · modo demo' : 'Sin conexión';
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} layout={LinearTransition}>
      <Pressable
        onPress={() => router.push('/mis-cosas/pendientes')}
        accessibilityRole="button"
        accessibilityLabel={`${titulo}. Ver pendientes de enviar`}
        className="flex-row items-center gap-2 bg-warning/15 px-4 py-2"
      >
        <Icon as={CloudSlash} size={16} weight="bold" className="text-warning" />
        <Text className="font-body-semibold text-xs text-foreground">{titulo}</Text>
        <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
          {ultimoSync ? `· vitrina guardada ${ultimoSync}` : '· mostrando lo guardado en el teléfono'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
