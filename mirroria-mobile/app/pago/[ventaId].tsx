import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PaymentScreen } from '@/src/features/payments/screens/PaymentScreen';

export default function PagoRoute() {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <PaymentScreen />
    </SafeAreaView>
  );
}
