import { outboxManager } from './outbox-manager'
import type { OperacionOutbox } from './idb.types'

/**
 * Las 3 operaciones que la clienta puede hacer sin red en la PWA (Movil_Spec D4):
 * agregar al carrito, confirmar el checkout y crear una reserva. El pago NUNCA se
 * encola (RN08): la venta nace PENDIENTE al sincronizar y recién ahí se paga.
 */
interface Base {
  tenantId: string
  usuarioId: string
  descripcion: string
}

const CLAVE_GRUPO = (usuarioId: string) => `mirroria:grupo-carrito:${usuarioId}`

/** Grupo "agregar sin red + confirmar compra": si un paso falla, el checkout del grupo se cancela. */
export function grupoCarrito(usuarioId: string): string {
  try {
    const actual = localStorage.getItem(CLAVE_GRUPO(usuarioId))
    if (actual) return actual
    const nuevo = crypto.randomUUID()
    localStorage.setItem(CLAVE_GRUPO(usuarioId), nuevo)
    return nuevo
  } catch {
    return crypto.randomUUID()
  }
}

export function cerrarGrupoCarrito(usuarioId: string): void {
  try {
    localStorage.removeItem(CLAVE_GRUPO(usuarioId))
  } catch {
    // sin storage: el próximo grupo es nuevo igual
  }
}

export function encolarAgregarCarrito(p: Base & { varianteId: string; cantidad: number }): Promise<OperacionOutbox> {
  return outboxManager.encolarOperacion({
    tenantId: p.tenantId,
    usuarioId: p.usuarioId,
    tipo: 'CARRITO_AGREGAR',
    endpoint: `/ventas/carrito/${p.usuarioId}/items`,
    payload: { varianteId: p.varianteId, cantidad: p.cantidad },
    descripcion: p.descripcion,
    grupoId: grupoCarrito(p.usuarioId),
  })
}

export async function encolarCheckout(
  p: Base & { sucursalId: string; codigoCupon?: string; metodoPago: string },
): Promise<OperacionOutbox> {
  const op = await outboxManager.encolarOperacion({
    tenantId: p.tenantId,
    usuarioId: p.usuarioId,
    tipo: 'CHECKOUT',
    endpoint: `/ventas/carrito/${p.usuarioId}/checkout`,
    payload: { sucursalId: p.sucursalId, canal: 'WEB', ...(p.codigoCupon ? { codigoCupon: p.codigoCupon } : {}) },
    descripcion: p.descripcion,
    grupoId: grupoCarrito(p.usuarioId),
    meta: { metodoPago: p.metodoPago },
  })
  cerrarGrupoCarrito(p.usuarioId)
  return op
}

export function encolarReserva(
  p: Base & { dto: { sucursalId: string; fechaHoraPrevista: string; items: { varianteId: string; cantidad: number }[] } },
): Promise<OperacionOutbox> {
  return outboxManager.encolarOperacion({
    tenantId: p.tenantId,
    usuarioId: p.usuarioId,
    tipo: 'RESERVA_CREAR',
    endpoint: '/reservas',
    payload: { ...p.dto },
    descripcion: p.descripcion,
  })
}
