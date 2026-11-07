/**
 * Estado que el cliente HTTP necesita en cada request y que viven en React
 * (tienda elegida, sesión, modo "Sin red"). Los providers lo actualizan;
 * `apiFetch` lo lee sin depender de React.
 */
interface ContextoHttp {
  tenantSlug: string | null;
  token: string | null;
  modoSinRed: boolean;
  /** NetInfo dice que no hay red (null = desconocido, no cuenta como offline). */
  sinConexion: boolean;
  /** Se llama ante un 401 con sesión: la sesión venció (JWT de 1 h, sin refresh). */
  alExpirarSesion: (() => void) | null;
}

export const contextoHttp: ContextoHttp = {
  tenantSlug: null,
  token: null,
  modoSinRed: false,
  sinConexion: false,
  alExpirarSesion: null,
};
