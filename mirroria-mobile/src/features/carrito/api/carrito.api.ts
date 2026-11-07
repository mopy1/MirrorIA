import * as Crypto from 'expo-crypto';
import { apiFetch } from '@/lib/api/cliente-http';
import { EP } from '@/lib/api/endpoints';
import type { CarritoDto } from '@/lib/db/tipos-espejo';

/**
 * M1: agregar al carrito SOLO con red (directo, con Idempotency-Key).
 * M2 lo reemplaza por `OutboxManager.encolar({ tipo: 'CARRITO_AGREGAR' })` (encolable sin red).
 */
export const agregarAlCarrito = (usuarioId: string, varianteId: string, cantidad = 1) =>
  apiFetch<CarritoDto>(`${EP.carrito(usuarioId)}/items`, {
    metodo: 'POST',
    cuerpo: { varianteId, cantidad },
    idempotencyKey: Crypto.randomUUID(),
  });
