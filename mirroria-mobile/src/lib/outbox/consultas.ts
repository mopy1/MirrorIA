import { listarEventos, listarFilas, obtenerFila } from './repo-outbox';
import { sqlOutbox } from './sql-expo';
import type { EventoOutbox, FilaOutbox } from './tipos';

/** Lecturas de la outbox para la UI (siempre SQLite, funcionan sin red). */

export async function listarOutbox(tenantId: string): Promise<FilaOutbox[]> {
  return listarFilas(await sqlOutbox(), tenantId);
}

export async function detalleOutbox(id: string): Promise<{ fila: FilaOutbox; eventos: EventoOutbox[] } | null> {
  const db = await sqlOutbox();
  const fila = await obtenerFila(db, id);
  return fila ? { fila, eventos: await listarEventos(db, id) } : null;
}

export const enCurso = (f: FilaOutbox) => f.estado === 'PENDIENTE' || f.estado === 'ENVIANDO';
export const terminada = (f: FilaOutbox) => !enCurso(f);

/** "#8F3A1C9E": primeros 8 del id en mayúsculas (mismo código que la web para ventas y reservas). */
export const codigoCorto = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;
