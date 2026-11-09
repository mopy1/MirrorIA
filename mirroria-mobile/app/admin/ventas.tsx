import React from 'react';
import { ConPermiso } from '@/src/features/staff/components/ConPermiso';
import { VentasScreen } from '@/src/features/staff/screens/VentasScreen';

export default function Pantalla() {
  return (
    <ConPermiso href="/admin/ventas" titulo="Ventas">
      <VentasScreen />
    </ConPermiso>
  );
}
