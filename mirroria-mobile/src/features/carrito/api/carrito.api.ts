import * as Crypto from 'expo-crypto';
import { apiFetch } from '@/lib/api/cliente-http';
import { EP } from '@/lib/api/endpoints';
import type { CarritoDto } from '@/lib/db/tipos-espejo';

/** Solo con red (spec §5.3): quitar del carrito. Agregar va SIEMPRE por la outbox (`lib/outbox/operaciones`). */
export const quitarDelCarrito = (usuarioId: string, varianteId: string) =>
  apiFetch<CarritoDto>(`${EP.carrito(usuarioId)}/items/${varianteId}`, { metodo: 'DELETE', idempotencyKey: Crypto.randomUUID() });

export interface CuponValidado {
  valido: boolean;
  mensaje?: string;
  descuentoCents: number;
  totalConDescuentoCents: number;
}

/** Solo con red: `POST /promociones/cupones/validar` (30/5 min por IP). */
export const validarCupon = (codigo: string, subtotalCents: number) =>
  apiFetch<CuponValidado>(EP.validarCupon, { metodo: 'POST', cuerpo: { codigo, subtotalCents } });
