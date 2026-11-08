import type { UsuarioRole } from '../../auth/types/auth.types';

/** "Resumen del negocio" (ejecutivo) u "Hoy en la tienda" (operativo). */
export type ModoDashboard = 'resumen' | 'tienda';

/**
 * Misma regla que la web (useDashboardPage): solo ADMIN ve el resumen del negocio y puede
 * cambiar entre las dos vistas; encargada y cajera ven siempre "Hoy en la tienda".
 */
export function modosParaRol(role: UsuarioRole | undefined): ModoDashboard[] {
  if (role === 'ADMIN') return ['resumen', 'tienda'];
  if (role === 'ENCARGADO_SUCURSAL' || role === 'CAJERO') return ['tienda'];
  return [];
}

/** La vista con la que abre el Inicio; un pedido inválido para el rol cae a la primera permitida. */
export function modoInicial(role: UsuarioRole | undefined, pedido?: string | null): ModoDashboard | null {
  const modos = modosParaRol(role);
  if (modos.length === 0) return null;
  const normalizado = pedido === 'operativo' ? 'tienda' : pedido;
  return modos.find((m) => m === normalizado) ?? modos[0];
}

/** Solo ADMIN elige sucursal en "Hoy en la tienda"; el resto ve la suya (la decide el backend). */
export function sucursalParaOperativo(role: UsuarioRole | undefined, sucursalId?: string): string | undefined {
  return role === 'ADMIN' ? sucursalId : undefined;
}

export function puedeVerInventario(role: UsuarioRole | undefined): boolean {
  return role === 'ADMIN' || role === 'ENCARGADO_SUCURSAL';
}

export type IdAcceso = 'cobros' | 'reservas' | 'inventario' | 'catalogo' | 'mostrador';

export interface AccesoDirecto {
  id: IdAcceso;
  texto: string;
  href: string;
  roles: UsuarioRole[];
}

/** Mismos accesos y permisos que la web (accesos-directos.tsx), más el Mostrador del menú móvil. */
export const ACCESOS: AccesoDirecto[] = [
  { id: 'mostrador', texto: 'Vender en mostrador', href: '/admin/mostrador', roles: ['ADMIN', 'CAJERO'] },
  { id: 'cobros', texto: 'Confirmar un cobro', href: '/admin/cobros', roles: ['ADMIN', 'CAJERO'] },
  { id: 'reservas', texto: 'Ver citas', href: '/admin/reservas', roles: ['ADMIN', 'ENCARGADO_SUCURSAL', 'CAJERO'] },
  { id: 'inventario', texto: 'Revisar stock', href: '/admin/inventario', roles: ['ADMIN', 'ENCARGADO_SUCURSAL'] },
  { id: 'catalogo', texto: 'Ver catálogo', href: '/admin/catalogo', roles: ['ADMIN'] },
];

export function accesosParaRol(role: UsuarioRole | undefined): AccesoDirecto[] {
  if (!role) return [];
  return ACCESOS.filter((a) => a.roles.includes(role));
}
