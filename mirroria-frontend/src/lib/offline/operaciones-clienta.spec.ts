import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { abrirDB, listarOutbox } from './idb'
import { outboxManager } from './outbox-manager'
import { encolarAgregarCarrito, encolarCheckout, encolarReserva } from './operaciones-clienta'

describe('operaciones encolables de la clienta (agregar, checkout, reserva)', () => {
  const store: Record<string, string> = {}

  beforeEach(async () => {
    for (const k of Object.keys(store)) delete store[k]
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => (store[k] = v),
      removeItem: (k: string) => delete store[k],
    })
    vi.stubGlobal('navigator', { onLine: false })
    const db = await abrirDB()
    const tx = db.transaction(['outbox'], 'readwrite')
    tx.objectStore('outbox').clear()
    await new Promise<void>((res) => (tx.oncomplete = () => res()))
  })

  afterEach(() => {
    outboxManager.detener()
    vi.unstubAllGlobals()
  })

  const base = { tenantId: 'tiendaria', usuarioId: 'u-1' }

  it('agregar + confirmar compra sin red quedan en el mismo grupo, en orden, y el checkout cierra el grupo', async () => {
    await encolarAgregarCarrito({ ...base, varianteId: 'v-m', cantidad: 1, descripcion: 'Vestido Gala · M' })
    await encolarCheckout({ ...base, sucursalId: 'suc-centro', metodoPago: 'EFECTIVO', descripcion: '1 prenda' })
    const siguiente = await encolarAgregarCarrito({ ...base, varianteId: 'v-s', cantidad: 1, descripcion: 'Otra' })

    const [agregar, checkout] = await listarOutbox()
    expect(agregar).toMatchObject({ tipo: 'CARRITO_AGREGAR', endpoint: '/ventas/carrito/u-1/items', payload: { varianteId: 'v-m', cantidad: 1 } })
    expect(checkout).toMatchObject({
      tipo: 'CHECKOUT',
      endpoint: '/ventas/carrito/u-1/checkout',
      payload: { sucursalId: 'suc-centro', canal: 'WEB' },
      meta: { metodoPago: 'EFECTIVO' },
      estado: 'PENDIENTE',
    })
    expect(checkout.grupoId).toBe(agregar.grupoId)
    expect(siguiente.grupoId).not.toBe(agregar.grupoId)
    // El método de pago no viaja al backend: sin red nunca se paga (RN08).
    expect(checkout.payload).not.toHaveProperty('metodoPago')
  })

  it('la reserva sin red se encola con su DTO tal cual y su propia clave', async () => {
    const dto = { sucursalId: 'suc-centro', fechaHoraPrevista: '2026-11-08T15:00:00.000Z', items: [{ varianteId: 'v-m', cantidad: 1 }] }
    const op = await encolarReserva({ ...base, dto, descripcion: 'Reserva: Vestido Gala · M' })
    expect(op).toMatchObject({ tipo: 'RESERVA_CREAR', endpoint: '/reservas', payload: dto, grupoId: null, estado: 'PENDIENTE' })
    expect(op.idempotencyKey).toHaveLength(36)
  })
})
