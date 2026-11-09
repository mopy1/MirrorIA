import { z } from 'zod';
import type { UsuarioSesion } from '@/lib/sesion/sesion-store';

export interface RespuestaAuth {
  accessToken: string;
  usuario: UsuarioSesion & { sucursalId?: string | null };
}

export const esquemaLogin = z.object({
  email: z.string().trim().email('Escribí un correo válido'),
  password: z.string().min(1, 'Escribí tu contraseña'),
});
export type DatosLogin = z.infer<typeof esquemaLogin>;

export const esquemaRegistro = z.object({
  fullName: z.string().trim().min(2, 'Tu nombre necesita al menos 2 letras'),
  email: z.string().trim().email('Escribí un correo válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});
export type DatosRegistro = z.infer<typeof esquemaRegistro>;

/** D2: el personal de la tienda no usa la app. */
export class ErrorCuentaPersonal extends Error {
  constructor() {
    super('Tu cuenta es del personal de la tienda: usala en la web, desde el panel de administración.');
    this.name = 'ErrorCuentaPersonal';
  }
}
