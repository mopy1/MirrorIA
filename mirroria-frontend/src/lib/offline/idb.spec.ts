import { beforeEach, describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import {
  TTL_CATALOGO_MS,
  abrirDB,
  actualizarOutbox,
  eliminarDeOutbox,
  guardarEnCatalogoCache,
  guardarEnOutbox,
  listarCatalogoCache,
  listarOutbox,
  normalizarEstado,
  obtenerDeCatalogoCache,
} from './idb'
import type { OperacionOutbox } from './idb.types'

describe('IndexedDB: Capa Offline (idb.ts)', () => {
  beforeEach(async () => {
    // Abrir DB y limpiar almacenes antes de cada prueba
    const db = await abrirDB()
    const tx = db.transaction(['catalogo_cache', 'outbox'], 'readwrite')
    tx.objectStore('catalogo_cache').clear()
    tx.objectStore('outbox').clear()
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve()
    })
  })

  describe('catalogo_cache y TTL de 7 días', () => {
    it('almacena y recupera un producto vigente (< 7 días)', async () => {
      await guardarEnCatalogoCache({
        id: 'prod-vestido-seda',
        tenantId: 'tiendaria',
        nombre: 'Vestido Seda Rosa',
        datos: { precio: 350 },
      })

      const item = await obtenerDeCatalogoCache<{ precio: number }>('prod-vestido-seda')
      expect(item).not.toBeNull()
      expect(item?.nombre).toBe('Vestido Seda Rosa')
      expect(item?.datos.precio).toBe(350)
      expect(item?.obsoleto).toBe(false)
    })

    it('marca producto como obsoleto si supera el TTL de 7 días', async () => {
      const guardadoAntiguo = Date.now() - (TTL_CATALOGO_MS + 3600000)

      await guardarEnCatalogoCache({
        id: 'prod-antiguo',
        tenantId: 'tiendaria',
        nombre: 'Vestido Temporada Pasada',
        datos: { precio: 200 },
        guardadoEn: guardadoAntiguo,
      })

      const item = await obtenerDeCatalogoCache('prod-antiguo')
      expect(item).not.toBeNull()
      expect(item?.obsoleto).toBe(true)
    })

    it('filtra catálogo por tenantId en listados', async () => {
      await guardarEnCatalogoCache({
        id: 'p1',
        tenantId: 'tiendaria',
        nombre: 'Prenda Tiendaria',
        datos: {},
      })
      await guardarEnCatalogoCache({
        id: 'p2',
        tenantId: 'otra-tienda',
        nombre: 'Prenda Otra',
        datos: {},
      })

      const lista = await listarCatalogoCache('tiendaria')
      expect(lista).toHaveLength(1)
      expect(lista[0].id).toBe('p1')
    })
  })

  describe('outbox: cola FIFO y persistencia', () => {
    const opEjemplo: OperacionOutbox = {
      id: 'op-1',
      tenantId: 'tiendaria',
      usuarioId: 'clienta-1',
      idempotencyKey: 'idemp-uuid-1',
      tipo: 'CHECKOUT',
      grupoId: null,
      descripcion: '1 prenda: Vestido Seda Rosa M',
      endpoint: '/ventas/carrito/clienta-1/checkout',
      metodo: 'POST',
      payload: { sucursalId: 'suc-1', canal: 'WEB' },
      estado: 'PENDIENTE',
      reintentos: 0,
      codigoRespuesta: null,
      respuesta: null,
      error: null,
      creadoEn: 1000,
      sincronizadoEn: null,
    }

    it('guarda y lista operaciones pendientes ordenadas por creadoEn', async () => {
      await guardarEnOutbox(opEjemplo)
      await guardarEnOutbox({
        ...opEjemplo,
        id: 'op-2',
        idempotencyKey: 'idemp-uuid-2',
        creadoEn: 500, // Anterior en el tiempo
      })

      const pendientes = await listarOutbox({ estado: 'PENDIENTE' })
      expect(pendientes).toHaveLength(2)
      expect(pendientes[0].id).toBe('op-2') // FIFO: el más antiguo primero
      expect(pendientes[1].id).toBe('op-1')
    })

    it('actualiza estado y respuesta en outbox', async () => {
      await guardarEnOutbox(opEjemplo)
      const actualizado = await actualizarOutbox('op-1', {
        estado: 'CONFIRMADA',
        codigoRespuesta: 201,
        respuesta: { comprobante: 'V-001' },
      })

      expect(actualizado?.estado).toBe('CONFIRMADA')
      expect(actualizado?.codigoRespuesta).toBe(201)

      const pendientes = await listarOutbox({ estado: 'PENDIENTE' })
      expect(pendientes).toHaveLength(0)
    })

    it('normaliza los estados viejos de la Fase 3 al leer (SINCRONIZADO → CONFIRMADA)', async () => {
      await guardarEnOutbox({ ...opEjemplo, estado: 'SINCRONIZADO' as unknown as OperacionOutbox['estado'] })
      const [fila] = await listarOutbox()
      expect(fila.estado).toBe('CONFIRMADA')
      expect(normalizarEstado('COMPENSADO')).toBe('COMPENSADA')
      expect(normalizarEstado('FALLIDO')).toBe('RECHAZADA')
    })

    it('filtra por clienta (usuarioId)', async () => {
      await guardarEnOutbox(opEjemplo)
      await guardarEnOutbox({ ...opEjemplo, id: 'op-otra', usuarioId: 'clienta-2' })
      const propias = await listarOutbox({ usuarioId: 'clienta-1' })
      expect(propias.map((o) => o.id)).toEqual(['op-1'])
    })

    it('elimina operaciones por id', async () => {
      await guardarEnOutbox(opEjemplo)
      const eliminado = await eliminarDeOutbox('op-1')
      expect(eliminado).toBe(true)

      const restantes = await listarOutbox()
      expect(restantes).toHaveLength(0)
    })
  })
})
