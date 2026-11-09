import * as Haptics from 'expo-haptics';
import { Trash } from 'phosphor-react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTema } from '@/contexts/TemaContext';
import type { ItemCarritoLocal } from '@/lib/db/repos/carrito.repo';
import { FilaCarrito } from './FilaCarrito';

interface Props {
  item: ItemCarritoLocal;
  /** Sin red o con unidades sin confirmar no se puede quitar (DELETE no es encolable). */
  habilitado: boolean;
  quitando: boolean;
  onQuitar: (varianteId: string) => void;
}

const ANCHO = 96;
const RESORTE = { damping: 20, stiffness: 220 };
const haptico = () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

/**
 * Deslizar a la izquierda descubre "Quitar" (spec §7.5); el toque en "Quitar" confirma.
 * Pan propio (RNGH v3 + Reanimated): el `ReanimatedSwipeable` de RNGH 3.3 dibujaba las acciones
 * en el flujo, arriba de la fila, en esta app (ver Troubleshooting).
 */
export function FilaCarritoDeslizable({ item, habilitado, quitando, onQuitar }: Props) {
  const { colores } = useTema();
  const x = useSharedValue(0);
  const inicio = useSharedValue(0);

  const pan = usePanGesture({
    enabled: habilitado,
    activeOffsetX: [-12, 12],
    onActivate: () => {
      'worklet';
      inicio.value = x.value;
    },
    onUpdate: (e) => {
      'worklet';
      x.value = Math.min(0, Math.max(-ANCHO * 1.2, inicio.value + e.translationX));
    },
    onDeactivate: (e) => {
      'worklet';
      const abrir = x.value < -ANCHO / 2 || e.velocityX < -600;
      if (abrir && inicio.value === 0) scheduleOnRN(haptico);
      x.value = withSpring(abrir ? -ANCHO : 0, RESORTE);
    },
  });
  const fila = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={{ overflow: 'hidden' }}>
      <Pressable
        onPress={() => onQuitar(item.varianteId)}
        disabled={quitando || !habilitado}
        accessibilityRole="button"
        accessibilityLabel={`Quitar ${item.nombre}`}
        style={[styles.accion, { backgroundColor: colores.danger }]}
      >
        {quitando ? <ActivityIndicator color="white" /> : <Icon as={Trash} size={22} weight="bold" className="text-white" />}
        <Text className="font-body-semibold text-xs text-white">Quitar</Text>
      </Pressable>
      <GestureDetector gesture={pan}>
        <Animated.View style={fila}>
          <FilaCarrito item={item} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  accion: { position: 'absolute', top: 0, bottom: 1, right: 0, width: ANCHO, alignItems: 'center', justifyContent: 'center', gap: 4 },
});
