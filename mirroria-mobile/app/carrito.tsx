import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CartScreen } from '@/src/features/cart/screens/CartScreen';

export default function CarritoRoute() {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <CartScreen />
    </SafeAreaView>
  );
}
