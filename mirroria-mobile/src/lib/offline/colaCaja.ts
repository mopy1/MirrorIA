import type { BaseLocal } from './baseLocal';

/**
 * Cola de ventas de la caja (mostrador) en SQLite. Cada venta guarda el cuerpo exacto y su
 * Idempotency-Key: se reenvía tal cual hasta tener una respuesta definitiva, así nunca se duplica.
 */
export type EstadoVentaCaja = 'PENDIENTE' | 'ENVIANDO' | 'ENVIADA' | 'FALLIDA';

export interface PayloadVentaCaja {
  sucursalId: string;
  /** Cuándo cobró la caja: el servidor acepta el precio que regía en ese momento. */
  vendidaEn: string;
  clienteId?: string;
  reservaId?: string;
  items: { varianteId: string; cantidad: number; precioUnitCents: number }[];
}

export interface VentaCaja {
  id: string;
  tienda: string;
  usuario_id: string;
  sucursal_id: string;
  clave: string;
  payload: string;
  resumen: string;
  total_cents: number;
  estado: EstadoVentaCaja;
  reintentos: number;
  codigo: number | null;
  error: string | null;
  respuesta: string | null;
  vendida_sin_conexion_en: number | null;
  creado_en: number;
  enviada_en: number | null;
  aviso_visto: number;
}

/** Quién cobró: la clave de idempotencia del servidor se calcula con el usuario, así que solo ella reenvía. */
export interface Cajera {
  tienda: string;
  usuarioId: string;
}

export interface NuevaVenta {
  id: string;
  clave: string;
  payload: PayloadVentaCaja;
  resumen: string;
  totalCents: number;
}

export interface RespuestaCaja {
  status: number;
  body: { codigo?: string; message?: string | string[]; detalles?: unknown } & Record<string, unknown>;
}

export type Veredicto = 'ENVIADA' | 'REINTENTAR' | 'FALLIDA';

/**
 * Lo mismo que la cola de la web: sin respuesta definitiva se reintenta con la misma clave.
 * Tienda suspendida (403 TIENDA_NO_DISPONIBLE) también espera: la venta ya se cobró.
 */
export function veredicto(status: number, codigo?: string): Veredicto {
  if (status >= 200 && status < 300) return 'ENVIADA';
  if (
    status === 0 || status === 401 || status === 408 || status === 429 || status >= 500 ||
    (status === 409 && codigo === 'IDEMPOTENCIA_EN_CURSO') ||
    (status === 403 && codigo === 'TIENDA_NO_DISPONIBLE')
  ) {
    return 'REINTENTAR';
  }
  return 'FALLIDA';
}

export function mensajeDe(r: RespuestaCaja): string {
  const m = r.body?.message;
  if (Array.isArray(m)) return m.join(', ');
  return typeof m === 'string' && m ? m : 'El servidor rechazó la venta.';
}

const INSERTAR = `INSERT INTO cola_caja
  (id, tienda, usuario_id, sucursal_id, clave, payload, resumen, total_cents, estado, codigo, respuesta, vendida_sin_conexion_en, creado_en, enviada_en)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

/** Venta cobrada sin red (o sin respuesta del servidor): queda pendiente con su clave. */
export async function encolarVenta(db: BaseLocal, c: Cajera, v: NuevaVenta, ahora = Date.now()): Promise<void> {
  await db.ejecutar(INSERTAR, [
    v.id, c.tienda, c.usuarioId, v.payload.sucursalId, v.clave, JSON.stringify(v.payload), v.resumen, v.totalCents,
    'PENDIENTE', null, null, ahora, ahora, null,
  ]);
}

/** Venta que el servidor ya registró en línea: se anota para descontarla del stock guardado. */
export async function anotarEnviada(
  db: BaseLocal,
  c: Cajera,
  v: NuevaVenta,
  respuesta: unknown,
  ahora = Date.now(),
): Promise<void> {
  await db.ejecutar(INSERTAR, [
    v.id, c.tienda, c.usuarioId, v.payload.sucursalId, v.clave, JSON.stringify(v.payload), v.resumen, v.totalCents,
    'ENVIADA', 201, JSON.stringify(respuesta ?? null), null, ahora, ahora,
  ]);
}

export async function ventasPendientes(db: BaseLocal, c: Cajera): Promise<VentaCaja[]> {
  return db.consultar<VentaCaja>(
    `SELECT * FROM cola_caja WHERE tienda = ? AND usuario_id = ? AND estado IN ('PENDIENTE', 'ENVIANDO') ORDER BY creado_en`,
    [c.tienda, c.usuarioId],
  );
}

/** Ventas que el servidor rechazó y nadie marcó como atendidas: el aviso sigue en pantalla. */
export async function ventasFallidasSinAtender(db: BaseLocal, c: Cajera): Promise<VentaCaja[]> {
  return db.consultar<VentaCaja>(
    `SELECT * FROM cola_caja WHERE tienda = ? AND usuario_id = ? AND estado = 'FALLIDA' AND aviso_visto = 0 ORDER BY creado_en`,
    [c.tienda, c.usuarioId],
  );
}

export async function marcarAtendida(db: BaseLocal, id: string): Promise<void> {
  await db.ejecutar('UPDATE cola_caja SET aviso_visto = 1 WHERE id = ?', [id]);
}

/**
 * Unidades que este teléfono vendió y la foto del stock todavía no refleja: lo pendiente,
 * y lo enviado después de tomar la foto. Vale para todas las cajeras del teléfono.
 */
export async function vendidoSinReflejar(
  db: BaseLocal,
  tienda: string,
  sucursalId: string,
  fotoTomadaEn: number,
): Promise<Record<string, number>> {
  const filas = await db.consultar<{ payload: string }>(
    `SELECT payload FROM cola_caja WHERE tienda = ? AND sucursal_id = ?
       AND (estado IN ('PENDIENTE', 'ENVIANDO') OR (estado = 'ENVIADA' AND enviada_en >= ?))`,
    [tienda, sucursalId, fotoTomadaEn],
  );
  const vendido: Record<string, number> = {};
  for (const f of filas) {
    const { items = [] } = JSON.parse(f.payload) as Partial<PayloadVentaCaja>;
    for (const i of items) vendido[i.varianteId] = (vendido[i.varianteId] ?? 0) + i.cantidad;
  }
  return vendido;
}

async function actualizar(db: BaseLocal, id: string, estado: EstadoVentaCaja, r: RespuestaCaja | null, ts: number | null) {
  await db.ejecutar(
    'UPDATE cola_caja SET estado = ?, codigo = ?, respuesta = ?, error = ?, enviada_en = ?, reintentos = reintentos + ? WHERE id = ?',
    [
      estado,
      r?.status ?? null,
      r ? JSON.stringify(r.body) : null,
      r && estado === 'FALLIDA' ? mensajeDe(r) : null,
      ts,
      estado === 'PENDIENTE' ? 1 : 0,
      id,
    ],
  );
}

export interface OpcionesSincronizar extends Cajera {
  /** Manda el cuerpo guardado con su clave; si no hay red, lanza. */
  enviar: (venta: VentaCaja) => Promise<RespuestaCaja>;
  alFallar?: (venta: VentaCaja, r: RespuestaCaja) => void;
  ahora?: () => number;
}

export interface ResultadoSincronizar {
  enviadas: number;
  fallidas: number;
  pendientes: number;
}

/** Lo enviado se guarda 8 días (uno más que la vigencia de la foto del stock) y después se borra. */
const RETENCION_MS = 8 * 24 * 60 * 60 * 1000;

/**
 * Envía en orden de cobro. Una venta rechazada (p. ej. otra caja se llevó la última unidad)
 * queda FALLIDA con su aviso y la cola sigue. Sin respuesta definitiva se corta y se reintenta después.
 */
export async function sincronizarCaja(db: BaseLocal, o: OpcionesSincronizar): Promise<ResultadoSincronizar> {
  const ahora = o.ahora ?? Date.now;
  await db.ejecutar(`DELETE FROM cola_caja WHERE estado = 'ENVIADA' AND enviada_en < ?`, [ahora() - RETENCION_MS]);
  let enviadas = 0;
  let fallidas = 0;
  const cola = await ventasPendientes(db, o);
  for (const venta of cola) {
    await actualizar(db, venta.id, 'ENVIANDO', null, null);
    let r: RespuestaCaja;
    try {
      r = await o.enviar(venta);
    } catch {
      await actualizar(db, venta.id, 'PENDIENTE', null, null);
      break;
    }
    const v = veredicto(r.status, r.body?.codigo);
    if (v === 'ENVIADA') {
      await actualizar(db, venta.id, 'ENVIADA', r, ahora());
      enviadas++;
    } else if (v === 'REINTENTAR') {
      await actualizar(db, venta.id, 'PENDIENTE', r, null);
      break;
    } else {
      await actualizar(db, venta.id, 'FALLIDA', r, ahora());
      fallidas++;
      o.alFallar?.({ ...venta, estado: 'FALLIDA', codigo: r.status, error: mensajeDe(r) }, r);
    }
  }
  return { enviadas, fallidas, pendientes: (await ventasPendientes(db, o)).length };
}
