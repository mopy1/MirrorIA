import { apiFetchCompleto } from '@/lib/api/cliente-http';
import { ApiError } from '@/lib/api/errores';
import type { FilaOutbox, RespuestaEnvio } from './tipos';

/** Manda una fila tal cual se guardó (mismo cuerpo, misma `Idempotency-Key`). Nunca lanza. */
export async function enviarOperacion(f: FilaOutbox): Promise<RespuestaEnvio> {
  try {
    const r = await apiFetchCompleto<Record<string, unknown> | null>(f.endpoint, {
      metodo: f.metodo,
      cuerpo: f.payload,
      idempotencyKey: f.idempotencyKey,
    });
    return { status: r.status, cuerpo: r.datos, cache: r.cabeceras.get('X-Cache-Idempotency') };
  } catch (e) {
    if (e instanceof ApiError) return { status: e.status, cuerpo: e.cuerpo, cache: e.cabeceras?.get('X-Cache-Idempotency') ?? null };
    // ErrorSinRed (modo demo, sin conexión, timeout de 15 s): para la cola es "no salió".
    return { status: 0, cuerpo: { message: e instanceof Error ? e.message : 'Sin conexión' }, cache: null };
  }
}
