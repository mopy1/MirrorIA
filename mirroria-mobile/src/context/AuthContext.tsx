import { useEffect, useMemo, useState, type ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import type { AuthResponse, UsuarioResponse } from '@/src/features/auth/types/auth.types';
import { setUnauthorizedCallback } from '@/src/lib/api';
import { storage } from '@/src/lib/storage';
import { cambiarTienda, cargarTienda } from '@/src/lib/tienda';
import { AuthContext, type AuthContextValue } from './auth-context';

/** `exp` del JWT (segundos) ya pasado. Token ilegible = se trata como vencido. */
function tokenVencido(token: string): boolean {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };
    return typeof exp === 'number' && exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStoredUser() {
      try {
        await cargarTienda();
        const raw = await storage.getItem('mirroria_user');
        const token = await storage.getItem('mirroria_token');
        // El JWT dura 1h: con uno vencido la app mostraba la sesión abierta y
        // recién fallaba (401) al agregar al carrito o reservar.
        // Sin red no se puede renovar: se conserva la sesión para seguir comprando.
        const sinRed = (await NetInfo.fetch()).isConnected === false;
        if (raw && token && (sinRed || !tokenVencido(token))) {
          setUser(JSON.parse(raw) as UsuarioResponse);
        } else if (raw || token) {
          await storage.removeItem('mirroria_token');
          await storage.removeItem('mirroria_user');
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadStoredUser();
  }, []);

  useEffect(() => {
    setUnauthorizedCallback(async () => {
      await storage.removeItem('mirroria_token');
      await storage.removeItem('mirroria_user');
      setUser(null);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login: async (auth: AuthResponse) => {
        await storage.setItem('mirroria_token', auth.accessToken);
        await storage.setItem('mirroria_user', JSON.stringify(auth.usuario));
        if (auth.usuario.tenant?.slug) await cambiarTienda(auth.usuario.tenant.slug);
        setUser(auth.usuario);
      },
      logout: async () => {
        await storage.removeItem('mirroria_token');
        await storage.removeItem('mirroria_user');
        setUser(null);
      },
    }),
    [user, isLoading]
  );

  // Hasta leer la tienda guardada no se pinta nada: toda petición necesita su X-Tenant.
  return <AuthContext.Provider value={value}>{isLoading ? null : children}</AuthContext.Provider>;
}
