import * as Crypto from 'expo-crypto';
import { apiFetch } from '@/lib/api/cliente-http';
import { EP } from '@/lib/api/endpoints';
import type { EstadoCobroQr } from '@/lib/pagos/estado-pago';

/** Espejo de `VentaResponseDto` (backend `ventas`). */
export interface VentaDto {
  id: string;
  sucursalId: string;
  reservaId: string | null;
  cuponId: string | null;
  canal: string;
  estado: string;
  numeroComprobante: string | null;
  subtotalCents: number;
  descuentoCents: number;
  totalCents: number;
  createdAt: string;
  items: { id: string; varianteId: string; cantidad: number; precioUnitCents: number; subtotalCents: number }[];
}

export interface PasarelaDto {
  id: string;
  estado: string;
}

export interface CobroQrDto {
  pagoId: string;
  ventaId: string;
  montoCents: number;
  comercio: string;
  referencia: string;
  /** PNG como data URL, listo para un `<Image>`. */
  qrImagen: string;
  qrContenido: string;
  estado: EstadoCobroQr;
}

export interface EstadoQrDto {
  pagoId: string;
  estado: EstadoCobroQr;
  transaccion: string | null;
  pagadoEn: string | null;
}

/** "Pagar en caja": lo que la clienta le dice a la cajera (que confirma en la web, `/admin/cobros`). */
export interface InstruccionesDto {
  pagoId: string;
  metodo: string;
  montoCents: number;
  referencia: string;
  instrucciones: string;
}

// Todo esto es SOLO con red (RN08): el cliente HTTP rechaza antes del fetch sin conexión.
// Los POST llevan Idempotency-Key nueva: el backend ya reutiliza el cobro pendiente de la venta.
const clave = () => Crypto.randomUUID();

export const obtenerVenta = (id: string) => apiFetch<VentaDto>(EP.venta(id));
export const misVentas = () => apiFetch<VentaDto[]>(EP.misVentas);
export const listarPasarelas = () => apiFetch<PasarelaDto[]>(EP.pasarelas, { tenant: false });
export const iniciarQr = (ventaId: string) => apiFetch<CobroQrDto>(EP.pagoQr(ventaId), { metodo: 'POST', idempotencyKey: clave() });
export const consultarQr = (pagoId: string) => apiFetch<EstadoQrDto>(EP.estadoQr(pagoId));
export const iniciarTarjeta = (ventaId: string) => apiFetch<{ url: string }>(EP.pagoTarjeta(ventaId), { metodo: 'POST', idempotencyKey: clave() });
export const iniciarEfectivo = (ventaId: string) =>
  apiFetch<InstruccionesDto>(EP.pagoEfectivo(ventaId), { metodo: 'POST', cuerpo: { metodo: 'EFECTIVO' }, idempotencyKey: clave() });
export const cancelarVenta = (ventaId: string) => apiFetch<null>(EP.cancelarVenta(ventaId), { metodo: 'POST', idempotencyKey: clave() });
