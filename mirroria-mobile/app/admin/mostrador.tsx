import React from 'react';
import { ConPermiso } from '@/src/features/staff/components/ConPermiso';
import { MostradorScreen } from '@/src/features/mostrador/screens/MostradorScreen';

export default function Pantalla() {
  return (
    <ConPermiso href="/admin/mostrador" titulo="Mostrador">
      <MostradorScreen />
    </ConPermiso>
  );
}
