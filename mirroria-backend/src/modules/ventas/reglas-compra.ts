/**
 * Topes anti-acaparamiento de la compra online (2026-09-29). Una compra
 * digital descuenta stock al hacer checkout y queda PENDIENTE hasta que se
 * paga (o vence, ver `pagos/service/expiracion.service.ts`): sin topes, una
 * cuenta podía dejar tomado el stock entero con compras que nunca iba a pagar.
 * No afectan la venta presencial (el cajero ya cobró).
 */
export const REGLAS_COMPRA = {
  /** Unidades de una misma talla/color por compra online (y en el carrito). */
  maxUnidadesPorVariante: 3,
} as const;

/**
 * Compras online todavía sin pagar que una clienta puede tener a la vez.
 * Configurable (`VENTAS_MAX_COMPRAS_PENDIENTES`, por defecto 2): el e2e de
 * pagos encadena varias ventas pendientes de la misma clienta a propósito.
 */
export function maxComprasPendientes(): number {
  const valor = Number(process.env.VENTAS_MAX_COMPRAS_PENDIENTES);
  return Number.isInteger(valor) && valor > 0 ? valor : 2;
}
