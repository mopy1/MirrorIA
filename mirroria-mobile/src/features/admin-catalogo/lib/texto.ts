/** Minúsculas y sin tildes: para buscar "camisa" y encontrar "Camisa Serranía". */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** "Vestido Gala Seda" → "vestido-gala-seda" (el identificador web que pide el backend). */
export function slugDesdeTitulo(titulo: string): string {
  return normalizar(titulo)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** El 409 de límite de plan siempre nombra al plan: así se distingue de otros 409 (igual que la web). */
export function esErrorDeLimite(mensaje: string): boolean {
  return /\bplan\b/i.test(mensaje);
}

/** Iniciales para el avatar: "Textiles del Sur" → "TS". */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
