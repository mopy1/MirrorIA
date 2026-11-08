import type { UsuarioRole } from '../types/auth.types';

/** Adónde va cada rol al abrir la app o al iniciar sesión (igual que la web). */
export function destinoTrasLogin(role: UsuarioRole): '/admin' | '/(tabs)' {
  return role === 'CUSTOMER' ? '/(tabs)' : '/admin';
}

export function esEquipo(role: UsuarioRole | undefined): boolean {
  return role === 'ADMIN' || role === 'ENCARGADO_SUCURSAL' || role === 'CAJERO';
}
