// Estado del pago en la app (M3.1). Puro: lo usan los hooks y los tests con node:test.

/** `VentaResponseDto.estado` del backend. */
export type EstadoVenta = 'PENDIENTE' | 'PAGADA' | 'ENTREGADA' | 'CANCELADA' | 'DEVUELTA_TOTAL' | 'DEVUELTA_PARCIAL';

/** Estado de un cobro por QR Wayra (`GET /pagos/qr/:pagoId`). */
export type EstadoCobroQr = 'PENDIENTE' | 'PAGADO' | 'VENCIDO';

/** Los tres caminos de la clienta. Efectivo = "Pagar en caja" (la cajera lo confirma en la web, sin POS). */
export type MetodoPagoApp = 'QR' | 'TARJETA' | 'EFECTIVO';

/** Qué pinta la pantalla de pago. */
export type VistaPago = 'PAGADA' | 'CANCELADA' | 'QR_VENCIDO' | 'ESPERANDO' | 'ELEGIR';

/** Pagada (o ya entregada / devuelta después de pagarse). */
export const ventaPagada = (e: string | undefined): boolean =>
  e === 'PAGADA' || e === 'ENTREGADA' || e === 'DEVUELTA_TOTAL' || e === 'DEVUELTA_PARCIAL';

interface EntradaVista {
  estadoVenta: string | undefined;
  /** Método con el cobro ya iniciado (null = todavía eligiendo). */
  iniciado: MetodoPagoApp | null;
  estadoQr?: EstadoCobroQr | null;
}

/** La venta manda: si el backend ya la dio por pagada, la pantalla cambia sola (sin importar el método). */
export function vistaPago({ estadoVenta, iniciado, estadoQr }: EntradaVista): VistaPago {
  if (ventaPagada(estadoVenta) || estadoQr === 'PAGADO') return 'PAGADA';
  if (estadoVenta === 'CANCELADA') return 'CANCELADA';
  if (iniciado === 'QR' && estadoQr === 'VENCIDO') return 'QR_VENCIDO';
  return iniciado ? 'ESPERANDO' : 'ELEGIR';
}

/** Cada cuánto se pregunta (ms). QR rápido para que se sienta instantáneo; efectivo depende de una persona. */
export const INTERVALO_MS: Record<MetodoPagoApp, number> = { QR: 3_000, TARJETA: 4_000, EFECTIVO: 5_000 };

/**
 * Polling de la venta: solo mientras hay un cobro iniciado, hay red y la venta sigue PENDIENTE.
 * `false` = no consultar (TanStack `refetchInterval`).
 */
export function intervaloConsulta(e: EntradaVista & { online: boolean }): number | false {
  if (!e.online || !e.iniciado) return false;
  const v = vistaPago(e);
  return v === 'ESPERANDO' ? INTERVALO_MS[e.iniciado] : false;
}

/** RN08: nunca se paga sin red. Devuelve el motivo para mostrar junto al botón deshabilitado. */
export function bloqueoPago(online: boolean, estadoVenta: string | undefined): string | null {
  if (!online) return 'Sin conexión: el pago necesita internet. Tus prendas siguen apartadas.';
  if (estadoVenta && estadoVenta !== 'PENDIENTE') return 'Esta compra ya no se puede pagar.';
  return null;
}

/** Id de pasarela del backend → método de la app. */
export const METODO_DE_PASARELA: Record<string, MetodoPagoApp> = { WAYRA: 'QR', STRIPE: 'TARJETA', MANUAL: 'EFECTIVO' };

/** Métodos ofrecidos: los de pasarelas DISPONIBLE; sin catálogo (falló la consulta) se ofrecen los tres. */
export function metodosDisponibles(pasarelas: { id: string; estado: string }[] | undefined): MetodoPagoApp[] {
  const orden: MetodoPagoApp[] = ['QR', 'TARJETA', 'EFECTIVO'];
  if (!pasarelas) return orden;
  const ok = new Set(pasarelas.filter((p) => p.estado === 'DISPONIBLE').map((p) => METODO_DE_PASARELA[p.id]));
  return orden.filter((m) => ok.has(m));
}

/** Token del QR Wayra: lo que va después de `/wayra/pagar/` en `qrContenido`. */
export function tokenDelQr(qrContenido: string): string | null {
  const m = /\/wayra\/pagar\/([^/?#]+)/.exec(qrContenido);
  return m ? decodeURIComponent(m[1]) : null;
}
