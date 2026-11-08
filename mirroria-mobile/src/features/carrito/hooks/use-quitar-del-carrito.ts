import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useSesion } from '@/contexts/SesionContext';
import { useTienda } from '@/contexts/TiendaContext';
import { reemplazarCarritoLocal } from '@/lib/db/repos/carrito.repo';
import { quitarDelCarrito } from '../api/carrito.api';

/** Quitar del carrito: solo con red (spec §5.3, no es encolable); copia el carrito devuelto a SQLite. */
export function useQuitarDelCarrito() {
  const { tienda } = useTienda();
  const { sesion } = useSesion();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (varianteId: string) => {
      const usuarioId = sesion!.usuario.id;
      const carrito = await quitarDelCarrito(usuarioId, varianteId);
      await reemplazarCarritoLocal(tienda!.id, usuarioId, carrito.items);
    },
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void qc.invalidateQueries({ queryKey: ['vitrina', 'carrito'] });
    },
    onError: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  });
}
