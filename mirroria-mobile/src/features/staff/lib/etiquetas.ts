// Textos de negocio, iguales a la web (ventas-table.data.ts, reservas-table.data.ts, cobros-table.tsx).

export type Tono = 'ambar' | 'verde' | 'azul' | 'rojo' | 'gris';

export const ESTADO_VENTA: Record<string, { label: string; tono: Tono }> = {
  PENDIENTE: { label: 'Pendiente de pago', tono: 'ambar' },
  PAGADA: { label: 'Pagada', tono: 'verde' },
  ENTREGADA: { label: 'Entregada', tono: 'verde' },
  CANCELADA: { label: 'Cancelada', tono: 'rojo' },
  DEVUELTA_PARCIAL: { label: 'Devuelta parcial', tono: 'gris' },
  DEVUELTA_TOTAL: { label: 'Devuelta', tono: 'gris' },
};

export const ESTADO_RESERVA: Record<string, { label: string; tono: Tono }> = {
  PENDIENTE: { label: 'Pendiente', tono: 'ambar' },
  CONFIRMADA: { label: 'Confirmada', tono: 'azul' },
  EN_TIENDA: { label: 'En tienda', tono: 'verde' },
  COMPLETADA: { label: 'Completada', tono: 'verde' },
  CANCELADA: { label: 'Cancelada', tono: 'rojo' },
  NO_SHOW: { label: 'No asistió', tono: 'gris' },
  EXPIRADA: { label: 'Expirada', tono: 'gris' },
};

export const METODO_PAGO: Record<string, string> = {
  TARJETA: 'Tarjeta',
  QR: 'QR',
  EFECTIVO: 'Efectivo',
  PAYPAL: 'PayPal',
  BILLETERA: 'PayPal',
};

/** Canal de la venta: la caja física o la tienda en línea (web o app). */
export function canalVenta(canal: string): string {
  const c = canal.toUpperCase();
  return c === 'PRESENCIAL' ? 'Caja física' : c === 'MOVIL' ? 'App' : 'Tienda web';
}

export type AccionReserva = { estado: string; label: string; tipo: 'principal' | 'secundaria' | 'peligro' };

/** Mismas transiciones que la web (estado-acciones.tsx) y que el backend (TRANSICIONES_MANUALES). */
export const TRANSICIONES: Record<string, AccionReserva[]> = {
  PENDIENTE: [
    { estado: 'CONFIRMADA', label: 'Confirmar', tipo: 'principal' },
    { estado: 'EN_TIENDA', label: 'Cliente llegó', tipo: 'secundaria' },
    { estado: 'CANCELADA', label: 'Cancelar', tipo: 'peligro' },
    { estado: 'EXPIRADA', label: 'Expirar', tipo: 'secundaria' },
  ],
  CONFIRMADA: [
    { estado: 'EN_TIENDA', label: 'Cliente llegó', tipo: 'principal' },
    { estado: 'CANCELADA', label: 'Cancelar', tipo: 'peligro' },
    { estado: 'NO_SHOW', label: 'No asistió', tipo: 'secundaria' },
    { estado: 'EXPIRADA', label: 'Expirar', tipo: 'secundaria' },
  ],
  // Se probó y no compró: libera las prendas. Si compra, se cobra en caja y la reserva se cierra sola.
  EN_TIENDA: [{ estado: 'CANCELADA', label: 'No compró', tipo: 'secundaria' }],
};

/** Total recaudado: solo lo cobrado (igual que la web). */
export function recaudado(ventas: { estado: string; totalCents: number }[]): number {
  return ventas.filter((v) => v.estado === 'PAGADA' || v.estado === 'ENTREGADA').reduce((a, v) => a + v.totalCents, 0);
}

export interface FiltroVentas {
  estado: string; // '' = todos
  canal: string; // '' | 'PRESENCIAL' | 'DIGITAL'
  periodo: string; // '' | 'hoy' | '7d' | '30d'
  texto: string; // comprobante o código
}

export function filtrarVentas<V extends { estado: string; canal: string; createdAt: string; id: string; numeroComprobante: string | null }>(
  ventas: V[],
  f: FiltroVentas,
  ahora = new Date(),
): V[] {
  let desde = -Infinity;
  if (f.periodo === 'hoy') desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
  if (f.periodo === '7d') desde = ahora.getTime() - 7 * 86_400_000;
  if (f.periodo === '30d') desde = ahora.getTime() - 30 * 86_400_000;
  const q = f.texto.replace(/[#\s]/g, '').toUpperCase();
  return ventas.filter((v) => {
    if (f.estado && v.estado !== f.estado) return false;
    const presencial = v.canal.toUpperCase() === 'PRESENCIAL';
    if (f.canal === 'PRESENCIAL' && !presencial) return false;
    if (f.canal === 'DIGITAL' && presencial) return false;
    if (new Date(v.createdAt).getTime() < desde) return false;
    if (q && !(v.numeroComprobante ?? '').toUpperCase().includes(q) && !v.id.toUpperCase().startsWith(q)) return false;
    return true;
  });
}
