import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useSesion } from '@/contexts/SesionContext';
import { useTienda } from '@/contexts/TiendaContext';
import { encolarAgregarCarrito } from '@/lib/outbox/operaciones';
import type { MetaOperacion } from '@/lib/outbox/tipos';

/**
 * "Agregar al carrito" SIEMPRE por la outbox (también sin red, spec §5.3): se ve al instante
 * con badge "Pendiente" y el `OutboxManager` lo envía cuando hay red.
 */
export function useAgregarCarrito() {
  const { sesion } = useSesion();
  const { tienda } = useTienda();
  return useMutation({
    networkMode: 'always',
    mutationFn: (p: { varianteId: string; meta: MetaOperacion }) =>
      encolarAgregarCarrito({ tenantId: tienda!.id, usuarioId: sesion!.usuario.id, ...p }),
    onSuccess: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    onError: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  });
}
