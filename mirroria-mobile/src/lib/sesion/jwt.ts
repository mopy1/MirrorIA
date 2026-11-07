/** Lee el `exp` (segundos) de un JWT sin librerías. null si no se puede leer. */
export function expiracionJwt(token: string): number | null {
  const parte = token.split('.')[1];
  if (!parte) return null;
  try {
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(globalThis.atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='))) as { exp?: number };
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
}

export function jwtVencido(token: string, ahoraMs = Date.now()): boolean {
  const exp = expiracionJwt(token);
  return exp !== null && exp * 1000 <= ahoraMs;
}
