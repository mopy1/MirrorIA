import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import * as React from 'react';

// Recordatorios LOCALES (Expo Go no recibe push remotas): también se muestran con la app abierta.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/** Tocar el recordatorio abre el Pase de Tienda (`data.ruta`); el pase tiene "← Volver" con respaldo. */
export function useAbrirDesdeNotificacion() {
  const respuesta = Notifications.useLastNotificationResponse();
  const abierta = React.useRef<string | null>(null);
  React.useEffect(() => {
    const ruta = respuesta?.notification.request.content.data?.ruta;
    const id = respuesta?.notification.request.identifier ?? null;
    if (typeof ruta !== 'string' || !id || abierta.current === id) return;
    if (respuesta?.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    abierta.current = id;
    router.push(ruta as Href);
  }, [respuesta]);
}
