/** El 409 de límite de plan siempre nombra al plan: así se distingue de otros 409 (igual que la web). */
export function esErrorDeLimite(mensaje: string | null | undefined): boolean {
  return !!mensaje && /\bplan\b/i.test(mensaje);
}

/** Mensaje del backend (ApiError trae `status`) si lo hay; si no, el genérico. */
export function mensajeDeError(err: unknown, porDefecto: string): string {
  if (err && typeof err === 'object' && 'status' in err && err instanceof Error && err.message) return err.message;
  return porDefecto;
}

/** Iniciales para el avatar: "Rosa Mamani" → "RM". */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
