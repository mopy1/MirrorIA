import { useMemo, useState } from 'react';
import { ApiError } from '@/src/lib/api';
import { refrescarMarcaTienda } from '../../saas/hooks/useMarcaTienda';
import type { SeccionMarca } from '../../saas/types/saas.types';
import { aparienciaApi } from '../api/aparienciaApi';
import { borradorDesde, conBloqueos, mismoBorrador, paraGuardar, validarMarca } from '../lib/marca-borrador';
import type { BorradorMarca, MiMarcaDto } from '../types/apariencia.types';

type Accion = 'guardar' | 'restablecer';

/**
 * Borrador local de la marca + guardar (PUT) y restablecer (POST). `vista` es
 * el borrador con lo bloqueado por el plan en su valor efectivo: lo que verá
 * el público. Los errores del backend (400 contraste, 409 plan) se muestran tal cual.
 */
export function useEditorMarca(mi: MiMarcaDto, onActualizado: (mi: MiMarcaDto) => void) {
  const [base, setBase] = useState(mi);
  const [borrador, setBorrador] = useState<BorradorMarca>(() => borradorDesde(mi));
  const [enCurso, setEnCurso] = useState<Accion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardadoOk, setGuardadoOk] = useState(false);
  if (base !== mi) {
    setBase(mi);
    setBorrador(borradorDesde(mi));
  }

  const vista = useMemo(() => conBloqueos(borrador, mi.efectiva, mi.permitido), [borrador, mi]);
  const errores = useMemo(() => validarMarca(vista), [vista]);
  const sucio = useMemo(() => !mismoBorrador(borrador, borradorDesde(mi)), [borrador, mi]);

  async function correr(accion: Accion, fn: () => Promise<MiMarcaDto>) {
    setEnCurso(accion);
    setError(null);
    setGuardadoOk(false);
    try {
      const nuevo = await fn();
      onActualizado(nuevo);
      refrescarMarcaTienda(nuevo.slug); // la app cambia de logo y color al instante
      setGuardadoOk(true);
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la apariencia');
      return false;
    } finally {
      setEnCurso(null);
    }
  }

  return {
    mi,
    borrador,
    vista,
    errores,
    sucio,
    valido: Object.keys(errores).length === 0,
    enCurso,
    error,
    guardadoOk,
    actualizar: (cambio: (b: BorradorMarca) => BorradorMarca) => {
      setGuardadoOk(false);
      setBorrador((b) => cambio(b));
    },
    descartar: () => setBorrador(borradorDesde(mi)),
    guardar: () => correr('guardar', () => aparienciaApi.guardar(paraGuardar(borrador))),
    restablecer: (s: SeccionMarca) => correr('restablecer', () => aparienciaApi.restablecer(s)),
  };
}

export type EditorMarca = ReturnType<typeof useEditorMarca>;
