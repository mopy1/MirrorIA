import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

/** Número grande centrado durante la cuenta regresiva del autorretrato. */
export function CountdownOverlay({ value }: { value: number }) {
  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 items-center justify-center bg-black/30"
    >
      <Text className="text-white font-bold" style={{ fontSize: 96 }}>
        {value}
      </Text>
    </View>
  );
}
