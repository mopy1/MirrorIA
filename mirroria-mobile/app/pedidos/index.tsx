import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrdersScreen } from '@/src/features/orders/screens/OrdersScreen';

export default function PedidosRoute() {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <OrdersScreen />
    </SafeAreaView>
  );
}
