import React from 'react';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Vacio } from '@/components/admin/Estados';
import { useAuth } from '@/src/hooks/useAuth';

/** Pantallas solo de la dueña (ADMIN), como en el menú de la web: el resto ve un aviso y no se llama a la API. */
export function SoloAdmin({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') {
    return (
      <PantallaAdmin titulo={titulo}>
        <Vacio titulo="Solo la administradora puede ver esta sección" detalle="Pedile acceso a la dueña de la tienda." />
      </PantallaAdmin>
    );
  }
  return <>{children}</>;
}
