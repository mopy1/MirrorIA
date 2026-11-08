// Tipos de la outbox (spec §4.2, §5). Sin imports de runtime: los usan los tests con node:sqlite.

/** Estados iguales en la PWA y en la app (D9). */
export type EstadoOutbox = 'PENDIENTE' | 'ENVIANDO' | 'CONFIRMADA' | 'COMPENSADA' | 'RECHAZADA';

/** Las únicas operaciones que se hacen sin red (D4). El pago nunca (RN08). */
export type TipoOperacion = 'CARRITO_AGREGAR' | 'CHECKOUT' | 'RESERVA_CREAR';

export type EfectoStock = 'DESCUENTA' | 'RESERVA';

/** Efecto de una operación sobre el stock local (`outbox_items`, D5). */
export interface ItemEfecto {
  varianteId: string;
  sucursalId: string;
  cantidad: number;
  efecto: EfectoStock;
}

/** Datos para la clienta que no viajan al backend (nombre de prenda, sucursal, total…). */
export interface MetaOperacion {
  productoId?: string;
  prenda?: string;
  talla?: string;
  color?: string;
  imagen?: string | null;
  sucursalNombre?: string;
  fechaHora?: string;
  totalCents?: number;
  codigoCupon?: string;
  lineas?: { prenda: string; talla: string; color: string; cantidad: number; precioCents: number }[];
}

export interface FilaOutbox {
  id: string;
  tenantId: string;
  usuarioId: string;
  grupoId: string | null;
  idempotencyKey: string;
  tipo: TipoOperacion;
  endpoint: string;
  metodo: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: Record<string, unknown>;
  estado: EstadoOutbox;
  reintentos: number;
  proximoIntentoEn: number | null;
  codigoRespuesta: number | null;
  cacheIdempotencia: string | null;
  respuesta: Record<string, unknown> | null;
  ultimoError: string | null;
  creadoEn: number;
  sincronizadoEn: number | null;
  descripcion: string;
  meta: MetaOperacion;
  /** Veces que salió hacia el servidor (eventos ENVIANDO); solo en los listados. */
  envios?: number;
}

/** Un paso de la línea de tiempo (`outbox_eventos`). */
export interface EventoOutbox {
  estado: EstadoOutbox;
  en: number;
  codigo: number | null;
  detalle: string | null;
}

/** `detalles` del 409 STOCK_AGOTADO_CONFLICTO (H6: con nombres y otras tallas). */
export interface DetalleConflicto {
  varianteId?: string;
  sucursalId?: string;
  disponible?: number;
  solicitado?: number;
  prendaNombre?: string;
  talla?: string;
  color?: string;
  sucursalNombre?: string;
  alternativas?: {
    otrasSucursales?: { sucursalId: string; sucursalNombre?: string; disponible: number }[];
    otrasTallas?: { varianteId: string; talla?: string; disponible: number }[];
  };
}

/** Lo que volvió del servidor. `status = 0`: no salió o no volvió (sin red, timeout). */
export interface RespuestaEnvio {
  status: number;
  cuerpo: Record<string, unknown> | null;
  cache: string | null;
}

/** Mínimo de SQL que necesita la cola: lo implementan expo-sqlite (app) y node:sqlite (tests). */
export interface BaseSql {
  run(sql: string, params?: (string | number | null)[]): Promise<void>;
  all<T>(sql: string, params?: (string | number | null)[]): Promise<T[]>;
  transaccion(fn: (tx: BaseSql) => Promise<void>): Promise<void>;
}
