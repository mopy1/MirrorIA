import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { abrirDB, listarOutbox } from './idb'
import type { ConflictoStockEvento } from './idb.types'
import { EVENTO_COMPRA_CONFIRMADA, EVENTO_CONFLICTO_STOCK, OutboxManager } from './outbox-manager'
import { CLAVE_SIN_RED } from './red-simulada'

const CLIENTA = 'clienta-b'
const respuesta = (status: number, body: unknown) => ({ ok: status < 300, status, json: () => Promise.resolve(body) })

describe('OutboxManager: compra de la clienta sin red (opción B, stock = 1)', () => {
  let manager: OutboxManager
  const listeners: Record<string, ((e: Event) => void)[]> = {}
  const localStore: Record<string, string> = {}

  const iniciarSesion = (token: string, id = CLIENTA) => {
    localStore.mirroria_token = token
    localStore.mirroria_user = JSON.stringify({ id, tenant: { slug: 'tiendaria' } })
  }
  const sinRed = () => vi.stubGlobal('navigator', { onLine: false })
  const conRed = () => vi.stubGlobal('navigator', { onLine: true })
  const encolarCheckout = (extra: Record<string, unknown> = {}) =>
    manager.encolarOperacion({
      tenantId: 'tiendaria',
      usuarioId: CLIENTA,
      tipo: 'CHECKOUT',
      endpoint: `/ventas/carrito/${CLIENTA}/checkout`,
      payload: { sucursalId: 'suc-centro', canal: 'WEB' },
      descripcion: '1 prenda: Vestido Gala M',
      ...extra,
    })

  beforeEach(async () => {
    for (const k of Object.keys(localStore)) delete localStore[k]
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => localStore[k] ?? null,
      setItem: (k: string, v: string) => (localStore[k] = v),
      removeItem: (k: string) => delete localStore[k],
    })
    for (const key of Object.keys(listeners)) delete listeners[key]
    vi.stubGlobal('window', {
      addEventListener: (type: string, h: (e: Event) => void) => (listeners[type] ??= []).push(h),
      removeEventListener: (type: string, h: (e: Event) => void) => {
        listeners[type] = (listeners[type] ?? []).filter((x) => x !== h)
      },
      dispatchEvent: (e: Event) => {
        ;(listeners[e.type] ?? []).forEach((h) => h(e))
        return true
      },
    })
    conRed()
    iniciarSesion('jwt-1')
    const db = await abrirDB()
    const tx = db.transaction(['outbox'], 'readwrite')
    tx.objectStore('outbox').clear()
    await new Promise<void>((res) => (tx.oncomplete = () => res()))
    manager = new OutboxManager()
  })

  afterEach(() => {
    manager.detener()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('sin red encola el checkout PENDIENTE con una Idempotency-Key UUID v4', async () => {
    sinRed()
    const op = await encolarCheckout()
    expect(op.estado).toBe('PENDIENTE')
    expect(op.idempotencyKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(await manager.obtenerPendientes('tiendaria')).toHaveLength(1)
  })

  it('al reconectar envía con su clave, tienda y JWT; queda CONFIRMADA y ofrece pagar', async () => {
    sinRed()
    await encolarCheckout({ idempotencyKey: 'clave-fija-123' })
    const fetchMock = vi.fn().mockResolvedValue(respuesta(201, { id: 'venta-1', numeroComprobante: 'C-0001' }))
    vi.stubGlobal('fetch', fetchMock)
    const confirmada = vi.fn()
    window.addEventListener(EVENTO_COMPRA_CONFIRMADA, confirmada)

    conRed()
    await manager.procesarCola()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain(`/ventas/carrito/${CLIENTA}/checkout`)
    expect(init.headers).toMatchObject({ 'Idempotency-Key': 'clave-fija-123', 'X-Tenant': 'tiendaria', Authorization: 'Bearer jwt-1' })
    const [fila] = await listarOutbox()
    expect(fila.estado).toBe('CONFIRMADA')
    expect(fila.respuesta).toEqual({ id: 'venta-1', numeroComprobante: 'C-0001' })
    expect(confirmada).toHaveBeenCalledTimes(1)
  })

  it('reutiliza la MISMA clave en el reintento tras un error de red', async () => {
    sinRed()
    const op = await encolarCheckout()
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('Failed to fetch')).mockResolvedValueOnce(respuesta(201, { id: 'v' }))
    vi.stubGlobal('fetch', fetchMock)
    conRed()

    await manager.procesarCola()
    expect((await listarOutbox())[0]).toMatchObject({ estado: 'PENDIENTE', reintentos: 1 })
    await manager.procesarCola()

    const claves = fetchMock.mock.calls.map((c) => c[1].headers['Idempotency-Key'])
    expect(claves).toEqual([op.idempotencyKey, op.idempotencyKey])
    expect((await listarOutbox())[0].estado).toBe('CONFIRMADA')
  })

  it('409 STOCK_AGOTADO_CONFLICTO → COMPENSADA, abre el modal con las alternativas reales y no se reenvía', async () => {
    sinRed()
    await encolarCheckout()
    const detalles = {
      prendaNombre: 'Vestido Gala',
      talla: 'M',
      sucursalNombre: 'Sucursal Centro',
      alternativas: {
        otrasSucursales: [{ sucursalId: 'suc-equipetrol', sucursalNombre: 'Equipetrol', disponible: 2 }],
        otrasTallas: [{ varianteId: 'v-s', talla: 'S', disponible: 1 }],
      },
    }
    const fetchMock = vi.fn().mockResolvedValue(respuesta(409, { status: 409, codigo: 'STOCK_AGOTADO_CONFLICTO', message: 'Stock insuficiente', detalles }))
    vi.stubGlobal('fetch', fetchMock)
    let evento: ConflictoStockEvento | null = null
    window.addEventListener(EVENTO_CONFLICTO_STOCK, (e) => (evento = (e as CustomEvent<ConflictoStockEvento>).detail))

    conRed()
    await manager.procesarCola()
    await manager.procesarCola()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect((await listarOutbox())[0]).toMatchObject({ estado: 'COMPENSADA', codigoRespuesta: 409 })
    expect(evento!.detalle).toEqual(detalles)
    expect(evento!.operacion.tipo).toBe('CHECKOUT')
  })

  it('si "agregar al carrito" se rechaza, el checkout del mismo grupo se cancela sin enviarse', async () => {
    sinRed()
    await manager.encolarOperacion({
      tenantId: 'tiendaria', usuarioId: CLIENTA, tipo: 'CARRITO_AGREGAR', grupoId: 'g-1', descripcion: 'Vestido Gala M',
      endpoint: `/ventas/carrito/${CLIENTA}/items`, payload: { varianteId: 'v-m', cantidad: 1 },
    })
    await encolarCheckout({ grupoId: 'g-1' })
    const fetchMock = vi.fn().mockResolvedValue(respuesta(409, { message: 'Podés llevar hasta 3 unidades' }))
    vi.stubGlobal('fetch', fetchMock)

    conRed()
    await manager.procesarCola()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [agregar, checkout] = await listarOutbox()
    expect(agregar).toMatchObject({ estado: 'RECHAZADA', error: 'Podés llevar hasta 3 unidades' })
    expect(checkout).toMatchObject({ estado: 'RECHAZADA', error: 'Cancelada porque falló el paso anterior' })
  })

  it('401 por JWT vencido pausa la cola hasta que entra una sesión nueva', async () => {
    sinRed()
    await encolarCheckout()
    const fetchMock = vi.fn().mockResolvedValueOnce(respuesta(401, { message: 'Unauthorized' })).mockResolvedValueOnce(respuesta(201, { id: 'v' }))
    vi.stubGlobal('fetch', fetchMock)
    conRed()

    await manager.procesarCola()
    expect(manager.estaPausada()).toBe(true)
    await manager.procesarCola()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect((await listarOutbox())[0].estado).toBe('PENDIENTE')

    iniciarSesion('jwt-2')
    await manager.procesarCola()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect((await listarOutbox())[0].estado).toBe('CONFIRMADA')
  })

  it('409 IDEMPOTENCIA_EN_CURSO deja la operación PENDIENTE para reintentar', async () => {
    sinRed()
    await encolarCheckout()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(409, { codigo: 'IDEMPOTENCIA_EN_CURSO', message: 'en curso' })))
    conRed()
    await manager.procesarCola()
    expect((await listarOutbox())[0]).toMatchObject({ estado: 'PENDIENTE', reintentos: 1 })
  })

  it('no envía operaciones de otra clienta ni con el modo demo "Simular sin red"', async () => {
    sinRed()
    await encolarCheckout({ usuarioId: 'clienta-a' })
    await encolarCheckout()
    const fetchMock = vi.fn().mockResolvedValue(respuesta(201, { id: 'v' }))
    vi.stubGlobal('fetch', fetchMock)
    conRed()

    localStore[CLAVE_SIN_RED] = '1'
    await manager.procesarCola()
    expect(fetchMock).not.toHaveBeenCalled()

    delete localStore[CLAVE_SIN_RED]
    await manager.procesarCola()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const estados = (await listarOutbox()).map((o) => `${o.usuarioId}:${o.estado}`)
    expect(estados.sort()).toEqual([`${CLIENTA}:CONFIRMADA`, 'clienta-a:PENDIENTE'].sort())
  })
})
