import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { ApiError } from '@/src/lib/api';
import { authApi } from '../api/authApi';
import type { LoginRequest } from '../types/auth.types';
import { destinoTrasLogin } from '../lib/destino';

export function useLogin() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(data: LoginRequest) {
    setIsLoading(true);
    setError(null);
    try {
      const auth = await authApi.login(data);
      await login(auth);
      // El equipo de la tienda va a su panel; la clienta vuelve a donde se pidió el login.
      if (auth.usuario.role !== 'CUSTOMER') router.replace(destinoTrasLogin(auth.usuario.role));
      else if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  }

  return { submit, isLoading, error };
}
