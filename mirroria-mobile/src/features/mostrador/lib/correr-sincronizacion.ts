import { baseLocal } from '@/src/lib/offline/expoBase';
import { sincronizarCaja, type ResultadoSincronizar, type VentaCaja } from '@/src/lib/offline/colaCaja';
import { mostradorApi } from '../api/mostradorApi';
import { avisarCambioCaja } from './eventos-caja';

let enCurso: Promise<ResultadoSincronizar> | null = null;

/** Una sola sincronización a la vez (la pantalla y el sincronizador del panel pueden pedirla juntas). */
export function correrSincronizacionCaja(
  cajera: { tienda: string; usuarioId: string },
  alFallar?: (venta: VentaCaja) => void,
): Promise<ResultadoSincronizar> {
  enCurso ??= (async () => {
    try {
      const r = await sincronizarCaja(await baseLocal(), {
        ...cajera,
        enviar: (v) => mostradorApi.enviarVenta(v.payload, v.clave, v.tienda),
        alFallar,
      });
      if (r.enviadas > 0 || r.fallidas > 0) avisarCambioCaja();
      return r;
    } finally {
      enCurso = null;
    }
  })();
  return enCurso;
}
