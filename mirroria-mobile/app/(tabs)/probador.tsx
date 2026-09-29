import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProbadorScreen } from '@/src/features/probador/screens/ProbadorScreen';

export default function ProbadorTab() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ProbadorScreen />
    </SafeAreaView>
  );
}
