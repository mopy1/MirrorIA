import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthResponse, UsuarioResponse } from '@/src/features/auth/types/auth.types';
import { setUnauthorizedCallback } from '@/src/lib/api';
import { storage } from '@/src/lib/storage';
import { AuthContext, type AuthContextValue } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStoredUser() {
      try {
        const raw = await storage.getItem('mirroria_user');
        if (raw) {
          setUser(JSON.parse(raw) as UsuarioResponse);
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
