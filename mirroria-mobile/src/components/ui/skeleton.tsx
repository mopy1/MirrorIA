import { cn } from '@/lib/utils';
import { cssInterop } from 'nativewind';
import * as React from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

cssInterop(Animated.View, { className: 'style' });

/**
 * Skeleton con Reanimated (opacidad 0.5 ↔ 1 en 900 ms). Nunca la clase de pulso
 * de Tailwind: con NativeWind 4.2.7 + RN 0.88 deja un worklet vivo al desmontar
 * (nativewind#1875). `cancelAnimation` en el cleanup.
 */
function Skeleton({ className, style, ...props }: React.ComponentProps<typeof View>) {
  const opacidad = useSharedValue(1);

  React.useEffect(() => {
    opacidad.value = withRepeat(withTiming(0.5, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    return () => cancelAnimation(opacidad);
  }, [opacidad]);

  const animado = useAnimatedStyle(() => ({ opacity: opacidad.value }));

  return (
    <Animated.View className={cn('bg-muted rounded-md', className)} style={[style, animado]} {...props} />
  );
}

export { Skeleton };
