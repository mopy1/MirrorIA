import { useEffect } from 'react';
import { Alert, AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '@/src/hooks/useAuth';
import { tiendaActual } from '@/src/lib/api';
import { correrSincronizacionCaja } from '../lib/correr-sincronizacion';

const CADA_MS = 30_000;

/**
 * Sin interfaz, montado en el panel: manda las ventas de caja que quedaron sin enviar al volver
 * internet, al volver a la app y cada 30 s (por si hay red pero el servidor no respondía).
 */
export function SincronizadorCaja() {
  const { user } = useAuth();
  const puedeCobrar = user?.role === 'ADMIN' || user?.role === 'CAJERO';

  useEffect(() => {
    if (!user || !puedeCobrar) return;
    const cajera = { tienda: tiendaActual(), usuarioId: user.id };
    const correr = () =>
      void correrSincronizacionCaja(cajera, (v) =>
        Alert.alert(
          'Una venta de caja no se registró',
          `${v.resumen}. ${v.error ?? ''}\nMirá el aviso en Mostrador: si la clienta ya pagó, devolvele el dinero.`,
        ),
      ).catch(() => {});

    const red = NetInfo.addEventListener((e) => {
      if (e.isConnected) correr();
    });
    const app = AppState.addEventListener('change', (e) => {
      if (e === 'active') correr();
    });
    const reloj = setInterval(correr, CADA_MS);
    correr();
    return () => {
      red();
      app.remove();
      clearInterval(reloj);
    };
  }, [user, puedeCobrar]);

  return null;
}
