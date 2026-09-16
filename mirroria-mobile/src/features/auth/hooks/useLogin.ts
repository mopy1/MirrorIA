import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { ApiError } from '@/src/lib/api';
import { authApi } from '../api/authApi';
import type { LoginRequest } from '../types/auth.types';

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
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  }

  return { submit, isLoading, error };
}
