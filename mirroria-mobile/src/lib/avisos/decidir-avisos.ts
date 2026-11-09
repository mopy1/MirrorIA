/**
 * "Avisame cuando vuelva" (idea 7, spec §4.3): tras cada snapshot del espejo se mira el stock
 * libre de cada variante con aviso. Un aviso armado (`notificadoEn = null`) se creó con la talla
 * agotada, así que `libre > 0` es justo el paso 0 → >0: se notifica UNA vez. Si la talla se vuelve
 * a agotar, el aviso se re-arma para avisar en la próxima reposición.
 */
export interface FilaAviso {
  id: string;
  notificadoEn: number | null;
  libre: number;
}

export interface DecisionAvisos {
  notificar: string[];
  rearmar: string[];
}

export function decidirAvisos(filas: readonly FilaAviso[]): DecisionAvisos {
  const notificar: string[] = [];
  const rearmar: string[] = [];
  for (const f of filas) {
    if (f.notificadoEn == null && f.libre > 0) notificar.push(f.id);
    else if (f.notificadoEn != null && f.libre <= 0) rearmar.push(f.id);
  }
  return { notificar, rearmar };
}

/** Estado que ve la clienta en `mis-cosas/avisos`. */
export function estadoAviso(f: Pick<FilaAviso, 'libre'>): 'ESPERANDO' | 'VOLVIO' {
  return f.libre > 0 ? 'VOLVIO' : 'ESPERANDO';
}
