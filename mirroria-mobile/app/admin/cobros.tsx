import React from 'react';
import { ConPermiso } from '@/src/features/staff/components/ConPermiso';
import { CobrosScreen } from '@/src/features/staff/screens/CobrosScreen';

export default function Pantalla() {
  return (
    <ConPermiso href="/admin/cobros" titulo="Cobros por confirmar">
      <CobrosScreen />
    </ConPermiso>
  );
}
