// "Comprar lo que reservé" y el Pase de Tienda (M3.2/M3.3). Puro: sin imports de runtime.

export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'EN_TIENDA' | 'COMPLETADA' | 'CANCELADA' | 'EXPIRADA' | 'NO_SHOW';

/** Mismas etiquetas que la web para la clienta (`estadoReserva.ts`). */
const ETIQUETAS: Record<string, string> = {
  PENDIENTE: 'Pendiente', CONFIRMADA: 'Confirmada', EN_TIENDA: 'En tienda', COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada', EXPIRADA: 'Vencida', NO_SHOW: 'No te presentaste',
};
export const etiquetaEstadoReserva = (e: string) => ETIQUETAS[e] ?? e;

/** Activa = cuenta para el cupo y el pase sirve (igual que `reservasActivas` del backend). */
export const reservaActiva = (e: string) => e === 'PENDIENTE' || e === 'CONFIRMADA' || e === 'EN_TIENDA';

/** Código del pase: primeros 8 del id en mayúsculas (mismo que `codigoReserva()` de la web). El QR lleva solo esto. */
export const codigoPase = (id: string) => id.slice(0, 8).toUpperCase();

interface VentaMin {
  id: string;
  reservaId: string | null;
  estado: string;
}

/** La compra PENDIENTE que ya salió de esta reserva (para no crear otra: el backend daría 409). */
export function ventaDeReserva(ventas: VentaMin[], reservaId: string, estado = 'PENDIENTE'): VentaMin | null {
  return ventas.find((v) => v.reservaId === reservaId && v.estado === estado) ?? null;
}

export type AccionPase =
  | { tipo: 'COMPRAR'; habilitado: boolean; motivo: string | null }
  | { tipo: 'PAGAR'; habilitado: boolean; motivo: string | null; ventaId: string }
  | { tipo: 'RECORDATORIO'; habilitado: boolean; motivo: string | null }
  | { tipo: 'VER_PEDIDO'; habilitado: true; motivo: null; ventaId: string | null }
  | { tipo: 'NINGUNA'; habilitado: false; motivo: string };

interface EntradaPase {
  estado: string;
  online: boolean;
  ventas: VentaMin[];
  reservaId: string;
  /** ms del recordatorio posible (null = ya no hay 1 h de margen). */
  recordatorioEn: number | null;
}

/**
 * La acción primaria del Pase según el estado. "Comprar lo que reservé" SOLO con la reserva `EN_TIENDA`
 * (la marca el personal en la web) y con red (D4: no se encola). Si ya hay compra pendiente: "Pagar".
 */
export function accionPase({ estado, online, ventas, reservaId, recordatorioEn }: EntradaPase): AccionPase {
  const sinRed = online ? null : 'Necesitás conexión para comprar.';
  if (estado === 'EN_TIENDA') {
    const pendiente = ventaDeReserva(ventas, reservaId);
    if (pendiente) return { tipo: 'PAGAR', habilitado: online, motivo: sinRed, ventaId: pendiente.id };
    return { tipo: 'COMPRAR', habilitado: online, motivo: sinRed };
  }
  if (estado === 'PENDIENTE' || estado === 'CONFIRMADA') {
    return recordatorioEn === null
      ? { tipo: 'RECORDATORIO', habilitado: false, motivo: 'Falta menos de 1 h: ya no hace falta recordatorio.' }
      : { tipo: 'RECORDATORIO', habilitado: true, motivo: null };
  }
  if (estado === 'COMPLETADA') {
    const pagada = ventas.find((v) => v.reservaId === reservaId && v.estado !== 'PENDIENTE' && v.estado !== 'CANCELADA');
    return { tipo: 'VER_PEDIDO', habilitado: true, motivo: null, ventaId: pagada?.id ?? null };
  }
  return { tipo: 'NINGUNA', habilitado: false, motivo: `Esta reserva está ${etiquetaEstadoReserva(estado).toLowerCase()}.` };
}

/** Recordatorio local 1 h antes; null si ya pasó ese momento (con 1 min de margen para programarlo). */
export function momentoRecordatorio(fechaIso: string, ahora = Date.now()): number | null {
  const en = Date.parse(fechaIso) - 60 * 60 * 1000;
  return Number.isFinite(en) && en > ahora + 60 * 1000 ? en : null;
}
