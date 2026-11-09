/** Tipos y contratos para la capa de almacenamiento IndexedDB y Outbox offline. */

/** Estados de la outbox, iguales en la PWA y en la app móvil (Movil_Spec D9). */
export type EstadoOutbox = 'PENDIENTE' | 'ENVIANDO' | 'CONFIRMADA' | 'COMPENSADA' | 'RECHAZADA'

/** Las únicas operaciones que se pueden hacer sin red (Movil_Spec D4). El pago nunca (RN08). */
export type TipoOperacionOutbox = 'CARRITO_AGREGAR' | 'CHECKOUT' | 'RESERVA_CREAR'

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
  /** Dueña de la operación: solo se envía con la sesión de esta clienta. */
  usuarioId: string
  /** UUID v4 generado UNA vez al encolar y reutilizado en cada reintento. */
  idempotencyKey: string
  tipo: TipoOperacionOutbox
  /** Agrupa "agregar al carrito + confirmar compra": si un paso falla, los siguientes se cancelan. */
  grupoId: string | null
  /** Texto para la clienta ("Vestido Gala · M · Sucursal Centro"). */
  descripcion: string
  /** Datos que no viajan al backend (p. ej. el método de pago elegido para después). */
  meta?: Record<string, unknown>
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
}

export interface AlternativasConflictoStock {
  otrasSucursales?: Array<{ sucursalId: string; sucursalNombre?: string; disponible: number }>
  otrasTallas?: Array<{ varianteId: string; talla?: string; disponible: number }>
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

/** Lo que viaja en el evento `mirroria:conflicto-stock`: el 409 y la operación que se compensó. */
export interface ConflictoStockEvento {
  detalle: DetalleConflictoStock
  operacion: OperacionOutbox
}
