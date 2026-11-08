import * as Crypto from 'expo-crypto';
import { EP } from '@/lib/api/endpoints';
import { borrarConfig, escribirConfig, leerConfig } from '@/lib/db/repos/configuracion.repo';
import { OutboxManager } from './outbox-manager';
import type { FilaOutbox, ItemEfecto, MetaOperacion } from './tipos';

/**
 * Las 3 operaciones encolables de la clienta (spec §5.3). El pago nunca se encola (RN08).
 * "Agregar" sin red + "Confirmar compra" comparten grupo: si un paso falla, el checkout se cancela.
 */
interface Base {
  tenantId: string;
  usuarioId: string;
}

async function grupoCarrito(usuarioId: string): Promise<string> {
  const actual = await leerConfig(`grupo_carrito:${usuarioId}`);
  if (actual) return actual;
  const nuevo = Crypto.randomUUID();
  await escribirConfig(`grupo_carrito:${usuarioId}`, nuevo);
  return nuevo;
}

const linea = (m: MetaOperacion) => [m.prenda, m.talla && `talla ${m.talla}`, m.color].filter(Boolean).join(' · ');

export async function encolarAgregarCarrito(p: Base & { varianteId: string; meta: MetaOperacion }): Promise<FilaOutbox> {
  return OutboxManager.encolar({
    tenantId: p.tenantId, usuarioId: p.usuarioId, tipo: 'CARRITO_AGREGAR',
    endpoint: `${EP.carrito(p.usuarioId)}/items`, payload: { varianteId: p.varianteId, cantidad: 1 },
    descripcion: `Agregar al carrito: ${linea(p.meta)}`, meta: p.meta, grupoId: await grupoCarrito(p.usuarioId),
  });
}

export async function encolarCheckout(
  p: Base & { sucursalId: string; codigoCupon?: string; items: Omit<ItemEfecto, 'efecto' | 'sucursalId'>[]; meta: MetaOperacion },
): Promise<FilaOutbox> {
  const fila = await OutboxManager.encolar({
    tenantId: p.tenantId, usuarioId: p.usuarioId, tipo: 'CHECKOUT',
    endpoint: `${EP.carrito(p.usuarioId)}/checkout`,
    payload: { sucursalId: p.sucursalId, canal: 'MOVIL', ...(p.codigoCupon ? { codigoCupon: p.codigoCupon } : {}) },
    descripcion: `Compra con retiro en ${p.meta.sucursalNombre ?? 'la sucursal'}`,
    items: p.items.map((i) => ({ ...i, sucursalId: p.sucursalId, efecto: 'DESCUENTA' })),
    meta: p.meta, grupoId: await grupoCarrito(p.usuarioId),
  });
  await borrarConfig(`grupo_carrito:${p.usuarioId}`);
  return fila;
}

export function encolarReserva(
  p: Base & { sucursalId: string; fechaHoraPrevista: string; varianteId: string; meta: MetaOperacion },
): Promise<FilaOutbox> {
  return OutboxManager.encolar({
    tenantId: p.tenantId, usuarioId: p.usuarioId, tipo: 'RESERVA_CREAR', endpoint: '/reservas',
    payload: { sucursalId: p.sucursalId, fechaHoraPrevista: p.fechaHoraPrevista, items: [{ varianteId: p.varianteId, cantidad: 1 }] },
    descripcion: `Reserva para probarme: ${linea(p.meta)}`,
    items: [{ varianteId: p.varianteId, sucursalId: p.sucursalId, cantidad: 1, efecto: 'RESERVA' }],
    meta: p.meta,
  });
}
