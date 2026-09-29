import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductDetailScreen } from '@/src/features/catalog/screens/ProductDetailScreen';

export default function ProductoRoute() {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ProductDetailScreen />
    </SafeAreaView>
  );
}
