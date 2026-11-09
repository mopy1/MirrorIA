import { useQuery } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { useSesion } from '@/contexts/SesionContext';
import { useTienda } from '@/contexts/TiendaContext';
import { conflictosStore } from './conflictos-store';
import { detalleOutbox, enCurso, listarOutbox } from './consultas';
import { OutboxManager } from './outbox-manager';

export const CLAVE_OUTBOX = ['outbox'] as const;

/** Toda la outbox de la tienda activa (SQLite). `mias` = de la clienta en sesión; `ajenas` = otra cuenta en este teléfono. */
export function useOutbox() {
  const { tienda } = useTienda();
  const { sesion } = useSesion();
  const q = useQuery({
    queryKey: [...CLAVE_OUTBOX, 'lista', tienda?.id],
    enabled: !!tienda,
    networkMode: 'always',
    staleTime: Infinity,
    queryFn: () => listarOutbox(tienda!.id),
  });
  const todas = q.data ?? [];
  const mias = todas.filter((f) => f.usuarioId === sesion?.usuario.id);
  const ajenas = todas.filter((f) => f.usuarioId !== sesion?.usuario.id && enCurso(f)).length;
  return { ...q, mias, ajenas, pendientes: mias.filter(enCurso).length };
}

export function useDetalleOutbox(id: string | undefined) {
  return useQuery({
    queryKey: [...CLAVE_OUTBOX, 'detalle', id],
    enabled: !!id,
    networkMode: 'always',
    staleTime: Infinity,
    queryFn: () => detalleOutbox(id!),
  });
}

/** Sincronizando / en pausa por 401 (reactivo). */
export function useEstadoOutbox() {
  return useSyncExternalStore(OutboxManager.suscribirEstado, OutboxManager.obtenerEstado);
}

export function useConflictoActual() {
  return useSyncExternalStore(conflictosStore.suscribir, conflictosStore.actual);
}
