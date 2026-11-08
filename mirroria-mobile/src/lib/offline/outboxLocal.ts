import type { BaseLocal } from './baseLocal';
import { agregarAlCarrito, marcarCambiosLocales, type ItemLocal } from './carritoLocal';

export type EstadoOutbox = 'PENDIENTE' | 'SINCRONIZANDO' | 'SINCRONIZADO' | 'COMPENSADO' | 'FALLIDO';

export interface Operacion {
  id: string;
  tienda: string;
  usuario_id: string;
  clave: string;
  tipo: string;
  endpoint: string;
  payload: string;
  estado: EstadoOutbox;
  reintentos: number;
  codigo: number | null;
  respuesta: string | null;
  error: string | null;
  creado_en: number;
  sincronizado_en: number | null;
}

interface Dueña { tienda: string; usuarioId: string }

export async function encolar(
  db: BaseLocal,
  d: Dueña,
  op: { id: string; clave: string; tipo: string; endpoint: string; payload: unknown },
  ahora = Date.now(),
): Promise<void> {
  await db.ejecutar(
    'INSERT INTO outbox (id, tienda, usuario_id, clave, tipo, endpoint, payload, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [op.id, d.tienda, d.usuarioId, op.clave, op.tipo, op.endpoint, JSON.stringify(op.payload), ahora],
  );
}

export async function pendientes(db: BaseLocal, d: Dueña): Promise<Operacion[]> {
  return db.consultar<Operacion>(
    `SELECT * FROM outbox WHERE tienda = ? AND usuario_id = ? AND estado IN ('PENDIENTE', 'SINCRONIZANDO') ORDER BY creado_en`,
    [d.tienda, d.usuarioId],
  );
}

/** Igual que la web: solo se reintenta lo que no es una respuesta definitiva. */
function debeReintentarse(status: number, codigo?: string): boolean {
  return (
    status === 0 || status === 401 || status === 408 || status === 429 || status >= 500 ||
    (status === 409 && codigo === 'IDEMPOTENCIA_EN_CURSO') ||
    (status === 403 && codigo === 'TIENDA_NO_DISPONIBLE')
  );
}

/** El mismo tope que el servidor: lo devuelto no puede dejar más de 3 unidades. */
const MAX_UNIDADES = 3;

async function devolverAlCarrito(db: BaseLocal, d: Dueña, op: Operacion): Promise<void> {
  const { items = [] } = JSON.parse(op.payload) as { items?: ItemLocal[] };
  for (const item of items) await agregarAlCarrito(db, d, item);
  await db.ejecutar('UPDATE carrito_local SET cantidad = ? WHERE tienda = ? AND usuario_id = ? AND cantidad > ?', [
    MAX_UNIDADES, d.tienda, d.usuarioId, MAX_UNIDADES,
  ]);
  await marcarCambiosLocales(db, d);
}

export interface RespuestaEnvio {
  status: number;
  body: { codigo?: string; message?: string; detalles?: unknown } & Record<string, unknown>;
}

interface Opciones extends Dueña {
  enviar: (op: Operacion) => Promise<RespuestaEnvio>;
  alConflicto?: (op: Operacion, detalles: unknown) => void;
  alRechazo?: (op: Operacion, mensaje: string) => void;
  ahora?: () => number;
}

async function actualizar(db: BaseLocal, id: string, estado: EstadoOutbox, r: RespuestaEnvio | null, ts: number | null) {
  await db.ejecutar(
    'UPDATE outbox SET estado = ?, codigo = ?, respuesta = ?, error = ?, sincronizado_en = ?, reintentos = reintentos + ? WHERE id = ?',
    [
      estado,
      r?.status ?? null,
      r ? JSON.stringify(r.body) : null,
      typeof r?.body?.message === 'string' ? r.body.message : null,
      ts,
      estado === 'PENDIENTE' ? 1 : 0,
      id,
    ],
  );
}

/**
 * Envía en orden. Conflicto de stock: esa compra se revierte en el teléfono (las
 * prendas vuelven al carrito) y se sigue con la próxima. Sin respuesta definitiva
 * se corta, para no alterar el orden, y se reintenta con la misma clave.
 */
export async function sincronizar(
  db: BaseLocal,
  o: Opciones,
): Promise<{ enviadas: number; compensadas: number; rechazadas: number }> {
  const ahora = o.ahora ?? Date.now;
  let enviadas = 0;
  let compensadas = 0;
  let rechazadas = 0;
  for (const op of await pendientes(db, o)) {
    await actualizar(db, op.id, 'SINCRONIZANDO', null, null);
    let r: RespuestaEnvio;
    try {
      r = await o.enviar(op);
    } catch {
      await actualizar(db, op.id, 'PENDIENTE', null, null);
      break;
    }
    if (r.status >= 200 && r.status < 300) {
      await actualizar(db, op.id, 'SINCRONIZADO', r, ahora());
      enviadas++;
    } else if (r.status === 409 && r.body?.codigo === 'STOCK_AGOTADO_CONFLICTO') {
      await actualizar(db, op.id, 'COMPENSADO', r, ahora());
      await devolverAlCarrito(db, o, op);
      compensadas++;
      o.alConflicto?.(op, r.body.detalles ?? r.body);
    } else if (debeReintentarse(r.status, r.body?.codigo)) {
      await actualizar(db, op.id, 'PENDIENTE', r, null);
      break;
    } else {
      // Rechazo de negocio (tope de unidades, compras sin pagar, prenda borrada):
      // la compra no sale, pero las prendas vuelven y se avisa. La cola sigue.
      await actualizar(db, op.id, 'FALLIDO', r, ahora());
      await devolverAlCarrito(db, o, op);
      rechazadas++;
      o.alRechazo?.(op, typeof r.body?.message === 'string' ? r.body.message : 'La compra no se pudo registrar.');
    }
  }
  return { enviadas, compensadas, rechazadas };
}
