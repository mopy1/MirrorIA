import * as Crypto from 'expo-crypto';
import { AppState } from 'react-native';
import { NetInfoListener } from '@/lib/red/net-info-listener';
import { ColaOutbox, type EncolarParams } from './cola-outbox';
import { enviarOperacion } from './enviar-operacion';
import { registrarEvento } from './repo-outbox';
import { sqlOutbox } from './sql-expo';
import type { BaseSql, DetalleConflicto, FilaOutbox, RespuestaEnvio } from './tipos';

export type EventoManager =
  | { tipo: 'cambio' }
  | { tipo: 'confirmadas'; filas: FilaOutbox[] }
  | { tipo: 'conflicto'; fila: FilaOutbox; detalle: DetalleConflicto };

interface Contexto {
  tenantId: string;
  usuarioId: string;
  token: string;
}

export interface EstadoManager {
  sincronizando: boolean;
  /** 401 / tienda no disponible: espera a que entre una sesión con OTRO token. */
  pausada: boolean;
}

/**
 * Frontera ICONIX `OutboxManager` (spec §5.2). Un solo camino de código: TODO se encola y
 * `procesarCola()` lo envía. Disparadores: encolar, reconexión (NetInfoListener), app activa,
 * "Sincronizar ahora", login (contexto nuevo), reintento con backoff y un timer de 30 s.
 */
class OutboxManagerImpl {
  private db: BaseSql | null = null;
  private cola: ColaOutbox | null = null;
  private ctx: Contexto | null = null;
  private tokenPausado: string | null = null;
  private otraVez = false;
  private reintento: ReturnType<typeof setTimeout> | null = null;
  private estado: EstadoManager = { sincronizando: false, pausada: false };
  private oyentes = new Set<(e: EventoManager) => void>();
  private oyentesEstado = new Set<() => void>();

  async iniciar(): Promise<void> {
    if (this.cola) return;
    this.db = await sqlOutbox();
    this.cola = new ColaOutbox({ db: this.db, enviar: enviarOperacion, uuid: Crypto.randomUUID });
    await this.cola.recuperarEnviando();
    NetInfoListener.suscribir((r) => r.online && void this.procesarCola());
    AppState.addEventListener('change', (s) => s === 'active' && void this.procesarCola());
    setInterval(() => void this.procesarCola(), 30_000);
  }

  /** La sesión de la clienta (o null). Un token nuevo levanta la pausa del 401. */
  ponerContexto(ctx: Contexto | null): void {
    this.ctx = ctx;
    if (ctx && ctx.token !== this.tokenPausado) this.tokenPausado = null;
    this.publicar({ pausada: !!ctx && this.tokenPausado === ctx.token });
    void this.procesarCola();
  }

  async encolar(p: EncolarParams): Promise<FilaOutbox> {
    if (!this.cola) await this.iniciar();
    const fila = await this.cola!.encolar(p);
    this.emitir({ tipo: 'cambio' });
    void this.procesarCola();
    return fila;
  }

  /** `forzar` = "Sincronizar ahora": no espera el backoff de la primera. */
  async procesarCola(forzar = false): Promise<void> {
    const ctx = this.ctx;
    if (!this.cola || !ctx || !NetInfoListener.obtener().online || this.tokenPausado === ctx.token) return;
    if (this.estado.sincronizando) {
      this.otraVez = true;
      return;
    }
    if (this.reintento) clearTimeout(this.reintento);
    this.reintento = null;
    this.publicar({ sincronizando: true });
    try {
      const r = await this.cola.procesar(ctx.tenantId, ctx.usuarioId, forzar);
      if (r.confirmadas.length) this.emitir({ tipo: 'confirmadas', filas: r.confirmadas });
      r.conflictos.forEach((c) => this.emitir({ tipo: 'conflicto', fila: c.fila, detalle: c.detalle }));
      if (r.pausada) this.tokenPausado = ctx.token;
      if (r.reintentoEn !== null) this.reintento = setTimeout(() => void this.procesarCola(), r.reintentoEn);
    } finally {
      this.publicar({ sincronizando: false, pausada: this.tokenPausado !== null && this.tokenPausado === this.ctx?.token });
      this.emitir({ tipo: 'cambio' });
      if (this.otraVez) {
        this.otraVez = false;
        void this.procesarCola();
      }
    }
  }

  /** Solo `__DEV__` (demo de idempotencia): reenvía con la MISMA clave sin cambiar el estado. */
  async reenviarMismaClave(f: FilaOutbox): Promise<RespuestaEnvio> {
    const r = await enviarOperacion(f);
    const db = this.db ?? (await sqlOutbox());
    const detalle = `Reenvío de prueba con la misma clave: HTTP ${r.status || 'sin red'}${r.cache ? ` · ${r.cache}` : ''}`;
    await db.transaccion((tx) => registrarEvento(tx, f.id, f.estado, Date.now(), r.status || null, detalle));
    this.emitir({ tipo: 'cambio' });
    return r;
  }

  async borrarTerminadas(tenantId: string, usuarioId: string): Promise<void> {
    const db = this.db ?? (await sqlOutbox());
    await db.run(
      `DELETE FROM outbox_local WHERE tenant_id = ? AND usuario_id = ? AND estado IN ('CONFIRMADA','COMPENSADA','RECHAZADA')`,
      [tenantId, usuarioId],
    );
    this.emitir({ tipo: 'cambio' });
  }

  suscribir = (fn: (e: EventoManager) => void): (() => void) => {
    this.oyentes.add(fn);
    return () => this.oyentes.delete(fn);
  };

  obtenerEstado = (): EstadoManager => this.estado;
  suscribirEstado = (fn: () => void): (() => void) => {
    this.oyentesEstado.add(fn);
    return () => this.oyentesEstado.delete(fn);
  };

  private publicar(p: Partial<EstadoManager>): void {
    const s = { ...this.estado, ...p };
    if (s.sincronizando === this.estado.sincronizando && s.pausada === this.estado.pausada) return;
    this.estado = s;
    this.oyentesEstado.forEach((o) => o());
  }

  private emitir(e: EventoManager): void {
    this.oyentes.forEach((o) => o(e));
  }
}

export const OutboxManager = new OutboxManagerImpl();
