/** Aviso interno: la cola de la caja cambió (se sincronizó, se cobró). La pantalla se refresca. */
const oyentes = new Set<() => void>();

export function avisarCambioCaja(): void {
  oyentes.forEach((fn) => fn());
}

export function alCambiarCaja(fn: () => void): () => void {
  oyentes.add(fn);
  return () => {
    oyentes.delete(fn);
  };
}
