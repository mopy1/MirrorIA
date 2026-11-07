import { beforeEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { abrirDB, guardarEnOutbox, listarOutbox } from './idb'
import type { OperacionOutbox } from './idb.types'
import { OutboxManager } from './outbox-manager'

const op = (id: string, extra: Partial<OperacionOutbox> = {}): OperacionOutbox => ({
  id, tenantId: 'luna', idempotencyKey: `k-${id}`, tipo: 'VENTA_PRESENCIAL', endpoint: '/ventas/presenciales',
  metodo: 'POST', payload: {}, estado: 'PENDIENTE', reintentos: 0, codigoRespuesta: null, respuesta: null,
  error: null, creadoEn: Number(id.replace(/\D/g, '')) || 1, sincronizadoEn: null, ...extra,
})

const responde = (status: number, body: unknown = {}) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }))

const estadoDe = async (id: string) => (await listarOutbox()).find((o) => o.id === id)?.estado

describe('sincronizacion de la cola', () => {
  beforeEach(async () => {
    const store: Record<string, string> = { mirroria_user: JSON.stringify({ tenant: { slug: 'luna' } }) }
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v },
      removeItem: (k: string) => { delete store[k] },
    })
    vi.stubGlobal('navigator', { onLine: true })
    const db = await abrirDB()
    await new Promise<void>((resolve) => {
      const tx = db.transaction('outbox', 'readwrite')
      tx.objectStore('outbox').clear()
      tx.oncomplete = () => resolve()
    })
  })

  it('un 500 no pierde la venta: queda pendiente con la misma clave', async () => {
    await guardarEnOutbox(op('a1'))
    vi.stubGlobal('fetch', responde(500))
    await new OutboxManager().procesarCola()
    expect(await estadoDe('a1')).toBe('PENDIENTE')
  })

  it('una sesion vencida (401) no descarta la venta', async () => {
    await guardarEnOutbox(op('a1'))
    vi.stubGlobal('fetch', responde(401))
    await new OutboxManager().procesarCola()
    expect(await estadoDe('a1')).toBe('PENDIENTE')
  })

  it('otro proceso con la misma clave en curso (409 comun) se reintenta', async () => {
    await guardarEnOutbox(op('a1'))
    vi.stubGlobal('fetch', responde(409, { message: 'operación en curso' }))
    await new OutboxManager().procesarCola()
    expect(await estadoDe('a1')).toBe('PENDIENTE')
  })

  it('una validacion rechazada (400) no se reintenta para siempre', async () => {
    await guardarEnOutbox(op('a1'))
    vi.stubGlobal('fetch', responde(400, { message: 'datos invalidos' }))
    await new OutboxManager().procesarCola()
    expect(await estadoDe('a1')).toBe('FALLIDO')
  })

  it('la cola de otra tienda no se manda con la sesion actual', async () => {
    await guardarEnOutbox(op('a1', { tenantId: 'sol' }))
    const red = responde(201)
    vi.stubGlobal('fetch', red)
    await new OutboxManager().procesarCola()
    expect(red).not.toHaveBeenCalled()
    expect(await estadoDe('a1')).toBe('PENDIENTE')
  })

  it('si se cerro la pestaña a mitad de envio, se reenvia con la misma clave', async () => {
    await guardarEnOutbox(op('a1', { estado: 'SINCRONIZANDO' }))
    const red = responde(201, { id: 'v1' })
    vi.stubGlobal('fetch', red)
    await new OutboxManager().procesarCola()
    expect(await estadoDe('a1')).toBe('SINCRONIZADO')
    const cabeceras = (red.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>
    expect(cabeceras['Idempotency-Key']).toBe('k-a1')
  })

  it('un conflicto de stock compensa esa venta y sigue con la siguiente', async () => {
    await guardarEnOutbox(op('a1'))
    await guardarEnOutbox(op('a2'))
    const red = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ codigo: 'STOCK_AGOTADO_CONFLICTO', message: 'agotado' }), { status: 409 }))
      .mockResolvedValueOnce(new Response('{}', { status: 201 }))
    vi.stubGlobal('fetch', red)
    await new OutboxManager().procesarCola()
    expect(await estadoDe('a1')).toBe('COMPENSADO')
    expect(await estadoDe('a2')).toBe('SINCRONIZADO')
  })
})
