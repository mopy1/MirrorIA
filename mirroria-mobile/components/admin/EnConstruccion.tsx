import React from 'react';
import { PantallaAdmin } from './PantallaAdmin';
import { Vacio } from './Estados';

export function EnConstruccion({ titulo }: { titulo: string }) {
  return (
    <PantallaAdmin titulo={titulo}>
      <Vacio titulo="Pantalla en construcción" />
    </PantallaAdmin>
  );
}
