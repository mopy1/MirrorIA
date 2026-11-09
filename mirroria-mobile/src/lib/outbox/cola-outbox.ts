import { clasificarRespuesta, esperaReintento } from './clasificar-respuesta.ts';
import { aplicarConfirmacion, cancelarRestoDelGrupo, insertarFila, obtenerFila, primeraPendiente, registrarEvento } from './repo-outbox.ts';
import type { BaseSql, DetalleConflicto, FilaOutbox, ItemEfecto, MetaOperacion, RespuestaEnvio, TipoOperacion } from './tipos.ts';

export interface EncolarParams {
  tenantId: string;
  usuarioId: string;
  tipo: TipoOperacion;
  endpoint: string;
  payload: Record<string, unknown>;
  descripcion: string;
  items?: ItemEfecto[];
  grupoId?: string | null;
  meta?: MetaOperacion;
}

export interface ResultadoCiclo {
  confirmadas: FilaOutbox[];
  conflictos: { fila: FilaOutbox; detalle: DetalleConflicto }[];
  rechazadas: FilaOutbox[];
  /** 401 / tienda no disponible: la cola espera un login nuevo. */
  pausada: boolean;
  /** ms hasta el próximo reintento (5xx, timeout, sin red, en curso), o null. */
  reintentoEn: number | null;
}

interface Dependencias {
  db: BaseSql;
  enviar: (f: FilaOutbox) => Promise<RespuestaEnvio>;
  uuid: () => string;
  ahora?: () => number;
  azar?: () => number;
}

/**
 * Núcleo del `OutboxManager` (spec §5.2), sin React ni timers: encolar y un ciclo FIFO.
 * Lo usan la app (expo-sqlite + apiFetch) y los tests (node:sqlite + un servidor falso).
 */
export class ColaOutbox {
  private ultimoCreado = 0;
  private readonly d: Dependencias;
  constructor(d: Dependencias) {
    this.d = d;
  }

  private ahora = () => (this.d.ahora ?? Date.now)();

  /** Siempre se encola (haya o no red): la clave se genera UNA vez y se reutiliza en cada reintento. */
  async encolar(p: EncolarParams): Promise<FilaOutbox> {
    const [u] = await this.d.db.all<{ m: number | null }>('SELECT MAX(creado_en) AS m FROM outbox_local');
    const creadoEn = (this.ultimoCreado = Math.max(this.ahora(), (u?.m ?? 0) + 1, this.ultimoCreado + 1));
    const fila: FilaOutbox = {
      id: this.d.uuid(), tenantId: p.tenantId, usuarioId: p.usuarioId, grupoId: p.grupoId ?? null,
      idempotencyKey: this.d.uuid(), tipo: p.tipo, endpoint: p.endpoint, metodo: 'POST', payload: p.payload,
      estado: 'PENDIENTE', reintentos: 0, proximoIntentoEn: null, codigoRespuesta: null, cacheIdempotencia: null,
      respuesta: null, ultimoError: null, creadoEn, sincronizadoEn: null, descripcion: p.descripcion, meta: p.meta ?? {},
    };
    await this.d.db.transaccion(async (tx) => {
      await insertarFila(tx, fila, p.items ?? []);
      await registrarEvento(tx, fila.id, 'PENDIENTE', creadoEn, null, 'Guardada en el teléfono');
    });
    return fila;
  }

  /** La app murió en vuelo: ENVIANDO → PENDIENTE (el reenvío con la misma clave da HIT si llegó). */
  async recuperarEnviando(): Promise<number> {
    const filas = await this.d.db.all<{ id: string }>(`SELECT id FROM outbox_local WHERE estado = 'ENVIANDO'`);
    await this.d.db.transaccion(async (tx) => {
      for (const f of filas) {
        await tx.run(`UPDATE outbox_local SET estado = 'PENDIENTE', proximo_intento_en = NULL WHERE id = ?`, [f.id]);
        await registrarEvento(tx, f.id, 'PENDIENTE', this.ahora(), null, 'Se cortó el envío: se reintenta con la misma clave');
      }
    });
    return filas.length;
  }

  /** Un ciclo FIFO estricto de la clienta en sesión. `forzar` ignora la espera del backoff ("Sincronizar ahora"). */
  async procesar(tenantId: string, usuarioId: string, forzar = false): Promise<ResultadoCiclo> {
    const r: ResultadoCiclo = { confirmadas: [], conflictos: [], rechazadas: [], pausada: false, reintentoEn: null };
    for (;;) {
      const f = await primeraPendiente(this.d.db, tenantId, usuarioId);
      if (!f) return r;
      if (!forzar && f.proximoIntentoEn && f.proximoIntentoEn > this.ahora()) {
        r.reintentoEn = f.proximoIntentoEn - this.ahora();
        return r;
      }
      forzar = false;
      if (!(await this.enviarUna(f, r))) return r;
    }
  }

  /** Envía y clasifica (spec §5.4). Devuelve false si el ciclo FIFO se corta. */
  private async enviarUna(f: FilaOutbox, r: ResultadoCiclo): Promise<boolean> {
    await this.d.db.transaccion(async (tx) => {
      await tx.run(`UPDATE outbox_local SET estado = 'ENVIANDO' WHERE id = ?`, [f.id]);
      await registrarEvento(tx, f.id, 'ENVIANDO', this.ahora(), null, f.reintentos ? `Reintento ${f.reintentos}` : null);
    });
    const res = await this.d.enviar(f);
    const c = clasificarRespuesta(res.status, res.cuerpo);
    const ahora = this.ahora();
    const codigo = res.status || null;

    if (c.estado === 'PENDIENTE') {
      const reintentos = c.accion === 'REINTENTAR' ? f.reintentos + 1 : f.reintentos;
      const espera = c.accion === 'REINTENTAR' ? esperaReintento(reintentos, (this.d.azar ?? Math.random)()) : null;
      await this.d.db.transaccion(async (tx) => {
        await tx.run(
          `UPDATE outbox_local SET estado = 'PENDIENTE', reintentos = ?, proximo_intento_en = ?, codigo_respuesta = ?, ultimo_error = ? WHERE id = ?`,
          [reintentos, espera === null ? null : ahora + espera, codigo, c.motivo, f.id],
        );
        await registrarEvento(tx, f.id, 'PENDIENTE', ahora, codigo, c.motivo);
      });
      if (c.accion === 'PAUSAR') r.pausada = true;
      else r.reintentoEn = espera;
      return false;
    }

    const motivo = c.estado === 'CONFIRMADA' ? null : c.motivo;
    const confirmada: FilaOutbox = { ...f, respuesta: res.cuerpo };
    await this.d.db.transaccion(async (tx) => {
      await tx.run(
        `UPDATE outbox_local SET estado = ?, codigo_respuesta = ?, cache_idempotencia = ?, respuesta_json = ?, ultimo_error = ?,
           sincronizado_en = ?, proximo_intento_en = NULL WHERE id = ?`,
        [c.estado, codigo, res.cache, res.cuerpo ? JSON.stringify(res.cuerpo) : null, motivo, ahora, f.id],
      );
      await registrarEvento(tx, f.id, c.estado, ahora, codigo, motivo ?? (res.cache === 'HIT' ? 'Ya estaba registrada (HIT)' : null));
      if (c.estado === 'CONFIRMADA') await aplicarConfirmacion(tx, confirmada, ahora);
      else await cancelarRestoDelGrupo(tx, f, ahora);
    });
    const final = (await obtenerFila(this.d.db, f.id)) ?? f;
    if (c.estado === 'CONFIRMADA') r.confirmadas.push(final);
    else if (c.estado === 'COMPENSADA') r.conflictos.push({ fila: final, detalle: (res.cuerpo?.detalles ?? {}) as DetalleConflicto });
    else r.rechazadas.push(final);
    return true;
  }
}
