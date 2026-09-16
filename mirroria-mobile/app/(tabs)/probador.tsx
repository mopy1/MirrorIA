import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FittingRoomScreen } from '@/src/features/virtual-fitting/screens/FittingRoomScreen';

export default function FittingRoomTab() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <FittingRoomScreen />
    </SafeAreaView>
  );
}
