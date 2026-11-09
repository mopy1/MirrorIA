import { apiFetch } from '@/lib/api/cliente-http';
import { EP } from '@/lib/api/endpoints';
import type { DatosLogin, DatosRegistro, RespuestaAuth } from '../types/auth.types';

/** Login en la tienda activa (X-Tenant), sin Bearer previo. Límite: 10 intentos / 5 min por IP. */
export const login = (d: DatosLogin) =>
  apiFetch<RespuestaAuth>(EP.login, { metodo: 'POST', cuerpo: { email: d.email.trim().toLowerCase(), password: d.password }, auth: false });

/** Alta de clienta (crea CUSTOMER en la tienda activa). */
export const registrar = (d: DatosRegistro) =>
  apiFetch<RespuestaAuth>(EP.registro, {
    metodo: 'POST',
    cuerpo: { email: d.email.trim().toLowerCase(), password: d.password, fullName: d.fullName.trim() },
    auth: false,
  });
