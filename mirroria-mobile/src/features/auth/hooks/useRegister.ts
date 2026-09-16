import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { ApiError } from '@/src/lib/api';
import { authApi } from '../api/authApi';
import type { RegisterRequest } from '../types/auth.types';

export function useRegister() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(data: RegisterRequest) {
    setIsLoading(true);
    setError(null);
    try {
      const auth = await authApi.register(data);
      await login(auth);
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  }

  return { submit, isLoading, error };
}
