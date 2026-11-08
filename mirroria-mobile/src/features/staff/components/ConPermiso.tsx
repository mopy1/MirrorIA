import React from 'react';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Vacio } from '@/components/admin/Estados';
import { puedeVer, MENU_ADMIN } from '@/src/features/admin/lib/menu-admin';
import { useAuth } from '@/src/hooks/useAuth';

/** Si el rol no puede ver la pantalla (mismas reglas que el menú y la web), avisa y no monta nada que llame a la API. */
export function ConPermiso({ href, titulo, children }: { href: string; titulo: string; children: React.ReactNode }) {
  const { user } = useAuth();
  const item = MENU_ADMIN.flatMap((g) => g.items).find((i) => i.href === href);
  if (item && puedeVer(item, user?.role)) return <>{children}</>;
  return (
    <PantallaAdmin titulo={titulo}>
      <Vacio titulo="No tenés acceso a esta pantalla" detalle="Pedile a la dueña de la tienda que te dé el permiso si lo necesitás." />
    </PantallaAdmin>
  );
}
