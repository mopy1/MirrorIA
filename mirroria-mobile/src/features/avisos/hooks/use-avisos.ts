import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useTienda } from '@/contexts/TiendaContext';
import { crearAviso, listarAvisos, quitarAviso } from '@/lib/db/repos/avisos.repo';
import { usePermisoNotificaciones } from './use-permiso-notificaciones';

/** Avisos de la tienda actual (SQLite `avisos_local`, por dispositivo; funcionan sin red). */
export function useAvisos() {
  const { tienda } = useTienda();
  return useQuery({
    queryKey: ['avisos', tienda?.id],
    enabled: !!tienda,
    networkMode: 'always',
    queryFn: () => listarAvisos(tienda!.id),
  });
}

/** Crear y quitar avisos. Al crear pide el permiso de notificaciones (si lo niega, el aviso igual queda). */
export function useMutacionesAviso() {
  const { tienda } = useTienda();
  const qc = useQueryClient();
  const permiso = usePermisoNotificaciones();
  const refrescar = () => void qc.invalidateQueries({ queryKey: ['avisos'] });

  const crear = useMutation({
    networkMode: 'always',
    mutationFn: async (varianteId: string) => {
      await crearAviso(tienda!.id, varianteId);
      return permiso.pedir();
    },
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refrescar();
    },
  });

  const quitar = useMutation({
    networkMode: 'always',
    mutationFn: quitarAviso,
    onSuccess: () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      refrescar();
    },
  });

  return { crear, quitar };
}
