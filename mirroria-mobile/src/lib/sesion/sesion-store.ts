import * as SecureStore from 'expo-secure-store';

export type RolUsuario = 'CUSTOMER' | 'ADMIN' | 'ENCARGADO_SUCURSAL' | 'CAJERO' | 'DUENO_PLATAFORMA';

export interface UsuarioSesion {
  id: string;
  email: string;
  fullName: string;
  role: RolUsuario;
  tenant: { id: string; slug: string; nombre: string } | null;
}

export interface Sesion {
  token: string;
  usuario: UsuarioSesion;
}

/** Una sesión por tienda (clave por slug): volver a una tienda recupera su sesión. */
const clave = (slug: string) => `mirroria.sesion.${slug.replace(/[^A-Za-z0-9._-]/g, '_')}`;

export async function leerSesion(slug: string): Promise<Sesion | null> {
  try {
    const raw = await SecureStore.getItemAsync(clave(slug));
    return raw ? (JSON.parse(raw) as Sesion) : null;
  } catch {
    return null;
  }
}

export async function guardarSesion(slug: string, sesion: Sesion): Promise<void> {
  await SecureStore.setItemAsync(clave(slug), JSON.stringify(sesion));
}

export async function borrarSesion(slug: string): Promise<void> {
  await SecureStore.deleteItemAsync(clave(slug));
}
