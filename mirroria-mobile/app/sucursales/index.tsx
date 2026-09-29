import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SucursalesScreen } from '@/src/features/sucursales/screens/SucursalesScreen';

export default function SucursalesRoute() {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <SucursalesScreen />
    </SafeAreaView>
  );
}
