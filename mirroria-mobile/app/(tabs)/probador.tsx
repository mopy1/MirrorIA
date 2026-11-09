import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { EN_EXPO_GO } from '@/src/lib/expoGo';

// El probador usa WebRTC nativo: se carga solo fuera de Expo Go, porque importarlo
// ahí revienta al no encontrar el módulo nativo.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ProbadorScreen = EN_EXPO_GO ? null : require('@/src/features/probador/screens/ProbadorScreen').ProbadorScreen;

export default function ProbadorTab() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {ProbadorScreen ? (
        <ProbadorScreen />
      ) : (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="text-center text-lg font-semibold">Probador virtual</Text>
          <Text className="text-center text-muted-foreground">
            El probador en vivo usa la cámara con video en tiempo real, que Expo Go no soporta. Probalo desde la web o
            con la app instalada (APK).
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
