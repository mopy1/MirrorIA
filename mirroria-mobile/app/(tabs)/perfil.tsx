import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileScreen } from '@/src/features/profile/screens/ProfileScreen';

export default function ProfileTab() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ProfileScreen />
    </SafeAreaView>
  );
}
