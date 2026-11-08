import { useAvisos } from './use-avisos';

/** ¿Ya hay un aviso para esta variante? (la ficha cambia su primaria a "Ya te avisamos"). */
export function useAvisoVariante(varianteId: string | undefined) {
  const q = useAvisos();
  return q.data?.find((a) => a.varianteId === varianteId) ?? null;
}
