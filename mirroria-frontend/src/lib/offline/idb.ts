import type { CatalogoItemCache, CatalogoItemConEstado, EstadoOutbox, OperacionOutbox } from './idb.types'

export const DB_NAME = 'mirroria_offline_db'
export const DB_VERSION = 1
export const STORE_CATALOGO = 'catalogo_cache'
export const STORE_OUTBOX = 'outbox'
export const TTL_CATALOGO_MS = 7 * 24 * 60 * 60 * 1000 // 7 días (requisito cátedra)

export function abrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB no está disponible en este entorno'))
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_CATALOGO)) {
        const store = db.createObjectStore(STORE_CATALOGO, { keyPath: 'id' })
        store.createIndex('idx_tenantId', 'tenantId', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
        const store = db.createObjectStore(STORE_OUTBOX, { keyPath: 'id' })
        store.createIndex('idx_estado', 'estado', { unique: false })
        store.createIndex('idx_creadoEn', 'creadoEn', { unique: false })
        store.createIndex('idx_tenantId', 'tenantId', { unique: false })
      }
    }
  })
}

export async function guardarEnCatalogoCache<T>(item: Omit<CatalogoItemCache<T>, 'guardadoEn'> & { guardadoEn?: number }): Promise<void> {
  const db = await abrirDB()
  const registro: CatalogoItemCache<T> = { ...item, guardadoEn: item.guardadoEn ?? Date.now() }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CATALOGO, 'readwrite')
    tx.objectStore(STORE_CATALOGO).put(registro)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function obtenerDeCatalogoCache<T>(id: string): Promise<CatalogoItemConEstado<T> | null> {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CATALOGO, 'readonly')
    const req = tx.objectStore(STORE_CATALOGO).get(id)
    req.onsuccess = () => {
      const res = req.result as CatalogoItemCache<T> | undefined
      if (!res) return resolve(null)
      const obsoleto = Date.now() - res.guardadoEn > TTL_CATALOGO_MS
      resolve({ ...res, obsoleto })
    }
    req.onerror = () => reject(req.error)
  })
}

export async function listarCatalogoCache<T>(tenantId?: string): Promise<CatalogoItemConEstado<T>[]> {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CATALOGO, 'readonly')
    const req = tx.objectStore(STORE_CATALOGO).getAll()
    req.onsuccess = () => {
      const items = (req.result as CatalogoItemCache<T>[]) || []
      const filtrados = tenantId ? items.filter((i) => i.tenantId === tenantId) : items
      const ahora = Date.now()
      resolve(filtrados.map((i) => ({ ...i, obsoleto: ahora - i.guardadoEn > TTL_CATALOGO_MS })))
    }
    req.onerror = () => reject(req.error)
  })
}

export async function guardarEnOutbox(operacion: OperacionOutbox): Promise<OperacionOutbox> {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OUTBOX, 'readwrite')
    tx.objectStore(STORE_OUTBOX).put(operacion)
    tx.oncomplete = () => resolve(operacion)
    tx.onerror = () => reject(tx.error)
  })
}

export async function actualizarOutbox(id: string, parcial: Partial<OperacionOutbox>): Promise<OperacionOutbox | null> {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OUTBOX, 'readwrite')
    const store = tx.objectStore(STORE_OUTBOX)
    const req = store.get(id)
    req.onsuccess = () => {
      const actual = req.result as OperacionOutbox | undefined
      if (!actual) return resolve(null)
      const actualizado: OperacionOutbox = { ...actual, ...parcial }
      store.put(actualizado)
      tx.oncomplete = () => resolve(actualizado)
    }
    req.onerror = () => reject(req.error)
    tx.onerror = () => reject(tx.error)
  })
}

export async function listarOutbox(filtro?: { estado?: EstadoOutbox; tenantId?: string }): Promise<OperacionOutbox[]> {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OUTBOX, 'readonly')
    const req = tx.objectStore(STORE_OUTBOX).getAll()
    req.onsuccess = () => {
      let items = (req.result as OperacionOutbox[]) || []
      if (filtro?.estado) items = items.filter((i) => i.estado === filtro.estado)
      if (filtro?.tenantId) items = items.filter((i) => i.tenantId === filtro.tenantId)
      items.sort((a, b) => a.creadoEn - b.creadoEn)
      resolve(items)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function eliminarDeOutbox(id: string): Promise<boolean> {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_OUTBOX, 'readwrite')
    tx.objectStore(STORE_OUTBOX).delete(id)
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

/** Al cerrar sesión: borra el catálogo guardado y las operaciones ya enviadas (con sus respuestas). */
export async function limpiarDatosOffline(): Promise<void> {
  const db = await abrirDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_CATALOGO, STORE_OUTBOX], 'readwrite')
    tx.objectStore(STORE_CATALOGO).clear()
    const outbox = tx.objectStore(STORE_OUTBOX)
    const req = outbox.getAll()
    req.onsuccess = () => {
      for (const op of req.result as OperacionOutbox[]) {
        // Un rechazo sin leer se conserva: la próxima persona en la caja tiene que verlo.
        if (op.estado === 'SINCRONIZADO' || op.estado === 'COMPENSADO' || (op.estado === 'FALLIDO' && op.avisado)) outbox.delete(op.id)
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
