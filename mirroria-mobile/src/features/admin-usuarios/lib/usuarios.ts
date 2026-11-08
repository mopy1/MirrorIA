import { z } from 'zod';
import type { CambioRolDto, RolUsuario, UsuarioAdmin } from '../types/usuarios-admin.types';

/** Mismos textos que ROLES_CONFIG de la web. */
export const ROLES: Record<RolUsuario, { label: string; descripcion: string }> = {
  ADMIN: { label: 'Administrador', descripcion: 'Acceso total a configuración, catálogo, ventas y reportes' },
  ENCARGADO_SUCURSAL: { label: 'Encargado de Sucursal', descripcion: 'Gestiona inventario, reservas y personal de su sucursal' },
  CAJERO: { label: 'Cajero', descripcion: 'Opera el punto de venta (POS) y cobros de sucursal' },
  CUSTOMER: { label: 'Cliente', descripcion: 'Usuario estándar con acceso a compras online y reservas' },
};

export const ROLES_LISTA = Object.keys(ROLES) as RolUsuario[];
export const ROLES_CON_SUCURSAL: string[] = ['ENCARGADO_SUCURSAL', 'CAJERO'];

export const MSJ_SUCURSAL_OBLIGATORIA = 'Este rol requiere asignar una sucursal obligatoriamente.';

export function etiquetaRol(role: string): string {
  return ROLES[role as RolUsuario]?.label ?? role;
}

export function necesitaSucursal(role: string): boolean {
  return ROLES_CON_SUCURSAL.includes(role);
}

export const rolSchema = z
  .object({ role: z.string().min(1), sucursalId: z.string() })
  .superRefine((v, ctx) => {
    if (necesitaSucursal(v.role) && !v.sucursalId) {
      ctx.addIssue({ code: 'custom', path: ['sucursalId'], message: MSJ_SUCURSAL_OBLIGATORIA });
    }
  });

export type RolFormValues = z.infer<typeof rolSchema>;

export function valoresRol(u: Pick<UsuarioAdmin, 'role' | 'sucursalId'>): RolFormValues {
  return { role: u.role, sucursalId: u.sucursalId ?? '' };
}

/** Solo el staff de sucursal manda sucursalId (igual que la web). */
export function armarCambioRol(v: RolFormValues): CambioRolDto {
  return { role: v.role, sucursalId: necesitaSucursal(v.role) ? v.sucursalId : undefined };
}

/** Hay algo que guardar (si no, el botón queda apagado como en la web). */
export function hayCambios(u: Pick<UsuarioAdmin, 'role' | 'sucursalId'>, v: RolFormValues): boolean {
  const sucursalFinal = necesitaSucursal(v.role) ? v.sucursalId : '';
  return v.role !== u.role || sucursalFinal !== (u.sucursalId ?? '');
}

/** Staff sin sucursal: la web lo marca con "Sin sucursal asignada". */
export function sinSucursal(u: Pick<UsuarioAdmin, 'role' | 'sucursalId'>): boolean {
  return necesitaSucursal(u.role) && !u.sucursalId;
}

export type FiltroRol = 'TODOS' | RolUsuario;

/** Buscador por nombre o correo + filtro por rol, como la página de la web. */
export function filtrarUsuarios(usuarios: UsuarioAdmin[], busqueda: string, rol: FiltroRol): UsuarioAdmin[] {
  const q = busqueda.trim().toLowerCase();
  return usuarios.filter(
    (u) =>
      (!q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (rol === 'TODOS' || u.role === rol)
  );
}
