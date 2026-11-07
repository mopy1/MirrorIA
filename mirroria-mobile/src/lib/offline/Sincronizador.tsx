import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '@/src/hooks/useAuth';
import { API_URL, tiendaActual } from '@/src/lib/api';
import { storage } from '@/src/lib/storage';
import { baseLocal } from './expoBase';
import { sincronizar, type Operacion, type RespuestaEnvio } from './outboxLocal';

async function enviar(op: Operacion): Promise<RespuestaEnvio> {
  const token = await storage.getItem('mirroria_token');
  const res = await fetch(`${API_URL}${op.endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': op.clave,
      'X-Tenant': op.tienda,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: op.payload,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

/** Sin interfaz: al volver internet, o al abrir la app, manda lo que quedó pendiente. */
export function Sincronizador() {
  const { user } = useAuth();
  const enCurso = useRef(false);

  useEffect(() => {
    if (!user) return;
    const usuarioId = user.id;

    async function correr() {
      if (enCurso.current) return;
      enCurso.current = true;
      try {
        await sincronizar(await baseLocal(), {
          tienda: tiendaActual(),
          usuarioId,
          enviar,
          alConflicto: () =>
            Alert.alert(
              'Una prenda se agotó',
              'Mientras estabas sin conexión otra persona se llevó la última unidad. No se te cobró y las prendas volvieron a tu carrito.',
            ),
        });
      } finally {
        enCurso.current = false;
      }
    }

    const dejarDeEscuchar = NetInfo.addEventListener((estado) => {
      if (estado.isConnected) void correr();
    });
    const alVolver = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void correr();
    });
    void correr();
    return () => {
      dejarDeEscuchar();
      alVolver.remove();
    };
  }, [user]);

  return null;
}
