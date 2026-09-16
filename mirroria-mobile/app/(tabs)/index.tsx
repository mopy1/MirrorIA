import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedScreen } from '@/src/features/feed/screens/FeedScreen';

export default function FeedTab() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <FeedScreen />
    </SafeAreaView>
  );
}
