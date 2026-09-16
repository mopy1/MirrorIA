import { createContext } from 'react';
import type { AuthResponse, UsuarioResponse } from '@/src/features/auth/types/auth.types';

export interface AuthContextValue {
  user: UsuarioResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (auth: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
