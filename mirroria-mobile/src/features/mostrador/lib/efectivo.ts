/** "Paga con": lo que escribe la cajera (Bs, con coma o punto) a centavos; null si no es un monto. */
export function aCentavos(texto: string): number | null {
  const limpio = texto.replace(/[^\d.,]/g, '').replace(',', '.');
  if (!limpio) return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

/** Cambio a devolver; null si todavía no alcanza para el total. */
export function cambio(recibidoCents: number | null, totalCents: number): number | null {
  if (recibidoCents === null || recibidoCents < totalCents) return null;
  return recibidoCents - totalCents;
}
