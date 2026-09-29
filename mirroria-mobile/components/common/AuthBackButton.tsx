import React from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

/** Salida visible de login/registro: vuelve a donde estaba la clienta (ej. la
 * ficha de una prenda) o al inicio si entró directo. */
export function AuthBackButton() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  return (
    <Pressable
      style={{ top: top + 8 }}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      hitSlop={10}
      accessibilityLabel="Volver"
      className="absolute left-4 z-10 w-10 h-10 items-center justify-center rounded-full active:bg-muted"
    >
      <Icon as={ChevronLeft} size={24} className="text-foreground" />
    </Pressable>
  );
}
