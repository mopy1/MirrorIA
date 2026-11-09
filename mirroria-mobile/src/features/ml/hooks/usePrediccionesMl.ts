import { useCallback, useEffect, useState } from 'react';
import { useConsulta } from '@/src/features/dashboard/hooks/useConsulta';
import type { UsuarioRole } from '@/src/features/auth/types/auth.types';
import { mlApi, type RespuestaMl } from '../api/mlApi';
import { consultasPermitidas } from '../lib/ml-consultas';

function vista<T>(c: { data: RespuestaMl<T> | null; isLoading: boolean; error: string | null; recargar: () => Promise<void> }) {
  return { data: c.data?.data ?? null, fallback: !!c.data?.fallback, isLoading: c.isLoading, error: c.error, reload: c.recargar };
}

function useNombresPrendas(enabled: boolean): Record<string, string> {
  const [nombres, setNombres] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!enabled) return;
    let activo = true;
    mlApi.nombresPrendas().then((n) => activo && setNombres(n)).catch(() => activo && setNombres({}));
    return () => {
      activo = false;
    };
  }, [enabled]);
  return nombres;
}

/** Las 4 predicciones + ficha técnica, solo las que el rol puede pedir, con aviso de estimación. */
export function usePrediccionesMl({ dias, sucursalId, rol }: { dias: number; sucursalId?: string; rol?: UsuarioRole }) {
  const ok = consultasPermitidas(rol);
  const demanda = vista(useConsulta(() => mlApi.demanda({ dias, sucursalId }), [dias, sucursalId], ok.demanda));
  const noShow = vista(useConsulta(() => mlApi.noShow(sucursalId), [sucursalId], ok.noShow));
  const rfm = vista(useConsulta(() => mlApi.rfm(), [], ok.rfm));
  const anomalias = vista(useConsulta(() => mlApi.anomalias(sucursalId), [sucursalId], ok.anomalias));
  const metricas = vista(useConsulta(() => mlApi.metricas(), [], ok.metricas));
  const nombres = useNombresPrendas(ok.demanda);

  const { reload: a } = demanda;
  const { reload: b } = noShow;
  const { reload: c } = rfm;
  const { reload: d } = anomalias;
  const { reload: e } = metricas;
  const recargarTodo = useCallback(() => {
    void Promise.all([a(), b(), c(), d(), e()]);
  }, [a, b, c, d, e]);

  const cargando = demanda.isLoading || noShow.isLoading || rfm.isLoading || anomalias.isLoading;
  const esEstimacion = demanda.fallback || noShow.fallback || rfm.fallback || anomalias.fallback;

  return { permitidas: ok, demanda, noShow, rfm, anomalias, metricas, nombres, cargando, esEstimacion, recargarTodo };
}

export type PrediccionesMl = ReturnType<typeof usePrediccionesMl>;
