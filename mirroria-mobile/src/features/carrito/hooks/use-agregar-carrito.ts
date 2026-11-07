import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useSesion } from '@/contexts/SesionContext';
import { CLAVE_SYNC } from '@/features/espejo/hooks/use-sincronizacion-espejo';
import { agregarAlCarrito } from '../api/carrito.api';

/** Agrega una variante y refresca el espejo (así `carrito_local` y el badge de la tab se actualizan). */
export function useAgregarCarrito() {
  const { sesion } = useSesion();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (varianteId: string) => agregarAlCarrito(sesion!.usuario.id, varianteId),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void qc.refetchQueries({ queryKey: CLAVE_SYNC });
    },
    onError: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  });
}
