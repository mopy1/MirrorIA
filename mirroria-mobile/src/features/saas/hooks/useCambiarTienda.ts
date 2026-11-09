import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { ApiError } from '@/src/lib/api';
import { cambiarTienda } from '@/src/lib/tienda';
import { saasApi } from '../api/saasApi';
import { errorDeSlug } from '../lib/slug';
import type { TiendaPublica } from '../types/saas.types';

export type DestinoTienda = 'tienda' | 'login';

/**
 * Pasar a otra tienda: se verifica que exista, se cierra la sesión de la
 * tienda anterior (cada tienda tiene sus propias cuentas) y se arranca de
 * cero en la nueva. El carrito y la cola sin internet del teléfono están
 * guardados por tienda y por clienta, así que no se mezclan ni se pierden:
 * al volver a la tienda anterior siguen ahí.
 */
export function useCambiarTienda() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [entrando, setEntrando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noDisponible, setNoDisponible] = useState<TiendaPublica | null>(null);

  function irA(destino: DestinoTienda) {
    if (router.canDismiss()) router.dismissAll();
    router.replace(destino === 'login' ? '/(auth)/login' : '/(tabs)');
  }

  async function entrar(slug: string, destino: DestinoTienda = 'tienda'): Promise<void> {
    const problema = errorDeSlug(slug);
    if (problema) {
      setError(problema);
      return;
    }
    setEntrando(slug);
    setError(null);
    setNoDisponible(null);
    try {
      const tienda = await saasApi.resolverTienda(slug);
      if (user && user.tenant?.slug !== tienda.slug) await logout();
      await cambiarTienda(tienda.slug);
      // Suspendida o vencida: se avisa en vez de abrir un catálogo que va a dar 403.
      if (!tienda.disponible && destino === 'tienda') {
        setNoDisponible(tienda);
        return;
      }
      irA(destino);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? 'No encontramos una tienda con esa dirección.'
          : err instanceof ApiError
            ? err.message
            : 'No se pudo abrir la tienda',
      );
    } finally {
      setEntrando(null);
    }
  }

  return { entrar, entrando, error, setError, noDisponible, cerrarNoDisponible: () => setNoDisponible(null), irA };
}
