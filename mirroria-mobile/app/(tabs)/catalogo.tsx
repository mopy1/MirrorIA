import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CatalogScreen } from '@/src/features/catalog/screens/CatalogScreen';

export default function CatalogTab() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <CatalogScreen />
    </SafeAreaView>
  );
}
