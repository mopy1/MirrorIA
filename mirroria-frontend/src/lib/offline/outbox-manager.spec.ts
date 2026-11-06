import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { abrirDB, listarOutbox } from './idb'
import { EVENTO_CONFLICTO_STOCK, OutboxManager } from './outbox-manager'

describe('OutboxManager (outbox-manager.ts)', () => {
  let manager: OutboxManager
  const listeners: Record<string, ((e: Event) => void)[]> = {}

  beforeEach(async () => {
    // Mock de localStorage
    const localStore: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => localStore[k] ?? null,
      setItem: (k: string, v: string) => (localStore[k] = v),
      removeItem: (k: string) => delete localStore[k],
      clear: () => {
        for (const k of Object.keys(localStore)) delete localStore[k]
      },
    })

    // Mock de window EventTarget
    for (const key of Object.keys(listeners)) delete listeners[key]
    const fakeWindow = {
      addEventListener: (type: string, handler: (e: Event) => void) => {
        if (!listeners[type]) listeners[type] = []
        listeners[type].push(handler)
      },
      removeEventListener: (type: string, handler: (e: Event) => void) => {
        if (listeners[type]) {
          listeners[type] = listeners[type].filter((h) => h !== handler)
        }
      },
      dispatchEvent: (e: Event) => {
        if (listeners[e.type]) {
          listeners[e.type].forEach((h) => h(e))
        }
        return true
      },
      location: { pathname: '/' },
    }
    vi.stubGlobal('window', fakeWindow)
    vi.stubGlobal('navigator', { onLine: true })

    // Limpiar BD
    const db = await abrirDB()
    const tx = db.transaction(['outbox'], 'readwrite')
    tx.objectStore('outbox').clear()
    await new Promise<void>((res) => {
      tx.oncomplete = () => res()
    })

    manager = new OutboxManager()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('encola una operación con Idempotency-Key y estado PENDIENTE', async () => {
    // Simular offline para que no intente procesar de inmediato
    vi.stubGlobal('navigator', { onLine: false })
    const op = await manager.encolarOperacion({
      tenantId: 'tiendaria',
      tipo: 'VENTA_PRESENCIAL',
      endpoint: '/ventas/presencial',
      payload: { totalCents: 15000 },
    })

    expect(op.id).toBeDefined()
    expect(op.idempotencyKey).toBeDefined()
    expect(op.estado).toBe('PENDIENTE')

    const pendientes = await manager.obtenerPendientes('tiendaria')
    expect(pendientes).toHaveLength(1)
    expect(pendientes[0].id).toBe(op.id)
  })

  it('procesa cola enviando la cabecera Idempotency-Key y marca SINCRONIZADO en 201', async () => {
    // Offline al encolar para controlar la ejecución manual de procesarCola
    vi.stubGlobal('navigator', { onLine: false })

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 'venta-123', comprobante: 'V-001' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await manager.encolarOperacion({
      tenantId: 'tiendaria',
      tipo: 'VENTA_PRESENCIAL',
      endpoint: '/ventas/presencial',
      payload: { sucursalId: 'suc-1' },
      idempotencyKey: 'clave-idempotencia-fija-123',
    })

    // Reconectar y procesar
    vi.stubGlobal('navigator', { onLine: true })
    await manager.procesarCola()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const callArgs = fetchMock.mock.calls[0]
    expect(callArgs[0]).toContain('/ventas/presencial')
    const headers = callArgs[1].headers as Record<string, string>
    expect(headers['Idempotency-Key']).toBe('clave-idempotencia-fija-123')

    const items = await listarOutbox()
    expect(items[0].estado).toBe('SINCRONIZADO')
    expect(items[0].codigoRespuesta).toBe(201)
    expect(items[0].respuesta).toEqual({ id: 'venta-123', comprobante: 'V-001' })
    expect(items[0].sincronizadoEn).not.toBeNull()
  })

  it('ante 409 STOCK_AGOTADO_CONFLICTO marca COMPENSADO y despacha evento', async () => {
    vi.stubGlobal('navigator', { onLine: false })

    const detallesConflicto = {
      prendaNombre: 'Vestido Gala Seda Rosa',
      talla: 'M',
      color: 'Rosa',
      alternativas: {
        otrasSucursales: [{ sucursalId: 'suc-2', sucursalNombre: 'Equipetrol', disponible: 3 }],
        otrasTallas: [{ varianteId: 'v-s', talla: 'S', disponible: 2 }],
      },
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({
          status: 409,
          codigo: 'STOCK_AGOTADO_CONFLICTO',
          message: 'Stock insuficiente para la variante',
          detalles: detallesConflicto,
        }),
    })
    vi.stubGlobal('fetch', fetchMock)

    let eventoDisparado: CustomEvent | null = null
    const handler = (e: Event) => {
      eventoDisparado = e as CustomEvent
    }
    window.addEventListener(EVENTO_CONFLICTO_STOCK, handler)

    await manager.encolarOperacion({
      tenantId: 'tiendaria',
      tipo: 'VENTA_PRESENCIAL',
      endpoint: '/ventas/presencial',
      payload: { varianteId: 'v-m', cantidad: 1 },
    })

    vi.stubGlobal('navigator', { onLine: true })
    await manager.procesarCola()

    const items = await listarOutbox()
    expect(items[0].estado).toBe('COMPENSADO')
    expect(items[0].codigoRespuesta).toBe(409)

    expect(eventoDisparado).not.toBeNull()
    expect(eventoDisparado!.detail).toEqual(detallesConflicto)

    window.removeEventListener(EVENTO_CONFLICTO_STOCK, handler)
  })

  it('ante error de red mantiene en PENDIENTE e incrementa reintentos', async () => {
    vi.stubGlobal('navigator', { onLine: false })

    const fetchMock = vi.fn().mockRejectedValue(new Error('Failed to fetch (offline)'))
    vi.stubGlobal('fetch', fetchMock)

    await manager.encolarOperacion({
      tenantId: 'tiendaria',
      tipo: 'VENTA_PRESENCIAL',
      endpoint: '/ventas/presencial',
      payload: {},
    })

    vi.stubGlobal('navigator', { onLine: true })
    await manager.procesarCola()

    const items = await listarOutbox()
    expect(items[0].estado).toBe('PENDIENTE')
    expect(items[0].reintentos).toBe(1)
    expect(items[0].error).toContain('Failed to fetch')
  })
})
