import type { DetalleConflicto, FilaOutbox } from './tipos';

export interface ConflictoAbierto {
  fila: FilaOutbox;
  detalle: DetalleConflicto;
}

/** Cola de 409 de stock por mostrar en `ModalConflictoStock` (uno a la vez). */
let abiertos: ConflictoAbierto[] = [];
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((o) => o());

export const conflictosStore = {
  abrir(c: ConflictoAbierto) {
    abiertos = [...abiertos.filter((a) => a.fila.id !== c.fila.id), c];
    avisar();
  },
  cerrar() {
    abiertos = abiertos.slice(1);
    avisar();
  },
  actual: (): ConflictoAbierto | null => abiertos[0] ?? null,
  suscribir(fn: () => void) {
    oyentes.add(fn);
    return () => void oyentes.delete(fn);
  },
};
