import React from 'react';
import { ConPermiso } from '@/src/features/staff/components/ConPermiso';
import { ReservasScreen } from '@/src/features/staff/screens/ReservasScreen';

export default function Pantalla() {
  return (
    <ConPermiso href="/admin/reservas" titulo="Reservas">
      <ReservasScreen />
    </ConPermiso>
  );
}
