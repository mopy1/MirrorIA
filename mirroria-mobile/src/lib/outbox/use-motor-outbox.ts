import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as React from 'react';
import { useSesion } from '@/contexts/SesionContext';
import { useTienda } from '@/contexts/TiendaContext';
import { CLAVE_SYNC } from '@/features/espejo/hooks/use-sincronizacion-espejo';
import { conflictosStore } from './conflictos-store';
import { OutboxManager } from './outbox-manager';
import { CLAVE_OUTBOX } from './use-outbox';

/**
 * Conecta el `OutboxManager` con React (una vez, en el layout raíz): le pasa la sesión,
 * refresca la UI en cada cambio, hápticos y `ModalConflictoStock` ante un 409 de stock.
 */
export function useMotorOutbox() {
  const { tienda } = useTienda();
  const { sesion } = useSesion();
  const qc = useQueryClient();

  React.useEffect(() => {
    OutboxManager.ponerContexto(tienda && sesion ? { tenantId: tienda.id, usuarioId: sesion.usuario.id, token: sesion.token } : null);
  }, [tienda, sesion]);

  React.useEffect(
    () =>
      OutboxManager.suscribir((e) => {
        void qc.invalidateQueries({ queryKey: CLAVE_OUTBOX });
        void qc.invalidateQueries({ queryKey: ['vitrina'] });
        if (e.tipo === 'confirmadas') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          void qc.refetchQueries({ queryKey: CLAVE_SYNC }); // spec §4.3: re-snapshot tras una CONFIRMADA
        }
        if (e.tipo === 'conflicto') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          conflictosStore.abrir({ fila: e.fila, detalle: e.detalle });
        }
      }),
    [qc],
  );
}
