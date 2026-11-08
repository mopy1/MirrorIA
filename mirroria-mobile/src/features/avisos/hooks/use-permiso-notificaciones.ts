import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

/** Estado del permiso de notificaciones; `pedir` lo solicita o, si ya se negó para siempre, abre Ajustes. */
export function usePermisoNotificaciones() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['permiso', 'notificaciones'],
    networkMode: 'always',
    queryFn: () => Notifications.getPermissionsAsync(),
  });

  const pedir = async (): Promise<boolean> => {
    const actual = await Notifications.getPermissionsAsync();
    if (actual.granted) return true;
    if (!actual.canAskAgain) {
      await Linking.openSettings();
      return false;
    }
    const r = await Notifications.requestPermissionsAsync();
    await qc.invalidateQueries({ queryKey: ['permiso', 'notificaciones'] });
    return r.granted;
  };

  return { concedido: q.data?.granted ?? true, cargando: q.isPending, pedir, refrescar: () => void q.refetch() };
}
