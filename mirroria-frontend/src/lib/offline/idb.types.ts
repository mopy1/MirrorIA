/** Tipos y contratos para la capa de almacenamiento IndexedDB y Outbox offline. */

export type EstadoOutbox = 'PENDIENTE' | 'SINCRONIZANDO' | 'SINCRONIZADO' | 'COMPENSADO' | 'FALLIDO'

export interface CatalogoItemCache<T = unknown> {
  id: string
  tenantId: string
  nombre?: string
  datos: T
  guardadoEn: number
}

export interface CatalogoItemConEstado<T = unknown> extends CatalogoItemCache<T> {
  obsoleto: boolean
}

export interface OperacionOutbox<TPayload = Record<string, unknown>, TRespuesta = Record<string, unknown>> {
  id: string
  tenantId: string
  idempotencyKey: string
  tipo: string
  endpoint: string
  metodo: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  payload: TPayload
  estado: EstadoOutbox
  reintentos: number
  codigoRespuesta: number | null
  respuesta: TRespuesta | null
  error: string | null
  creadoEn: number
  sincronizadoEn: number | null
  /** Un rechazo se muestra hasta que alguien lo lee. */
  avisado?: boolean
}

export interface AlternativasConflictoStock {
  otrasSucursales?: Array<{ sucursalId: string; sucursalNombre: string; disponible: number }>
  otrasTallas?: Array<{ varianteId: string; talla: string; disponible: number }>
}

export interface DetalleConflictoStock {
  varianteId?: string
  prendaNombre?: string
  talla?: string
  color?: string
  sucursalId?: string
  sucursalNombre?: string
  disponible?: number
  solicitado?: number
  alternativas?: AlternativasConflictoStock
}
