import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storage } from './storage';

const CLOUDFLARE_TUNNEL_URL =
  'https://tulsa-maintenance-deployment-occasion.trycloudflare.com/api/v1';

function getDefaultApiUrl(): string {
  // 1. En la PC local (navegador web), va directo a localhost
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.location?.hostname === 'localhost'
  ) {
    return 'http://localhost:3000/api/v1';
  }

  // 2. Variable de entorno explícita si está definida
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 3. Túnel público Cloudflare (garantiza conexión desde cualquier celular)
  return CLOUDFLARE_TUNNEL_URL;
}

export const API_URL = getDefaultApiUrl();
console.log(`[MirrorIA Mobile] API_URL configurada en: ${API_URL}`);

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface BackendErrorBody {
  status: number;
  message: string | string[];
  timestamp: string;
}

let onUnauthorizedCallback: (() => void) | null = null;

export function setUnauthorizedCallback(cb: () => void) {
  onUnauthorizedCallback = cb;
}

/**
 * fetch tipado con:
 * - Detección inteligente de URL base (Web, Móvil, Emulador)
 * - Headers JSON y Bearer Token persistente
 * - Trazabilidad y logs de consola en desarrollo
 * - Captura amigable de errores de red (Network Request Failed)
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await storage.getItem('mirroria_token');
  const isAuthEndpoint = path.startsWith('/seguridad/auth/');
  const fullUrl = `${API_URL}${path}`;

  console.log(`[API Request] ${options.method ?? 'GET'} -> ${fullUrl}`);

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (netErr: any) {
    console.error(`[API Network Error] Falló conexión con ${fullUrl}:`, netErr);
    throw new ApiError(
      0,
      `No se pudo conectar al servidor en ${fullUrl}. Verificá que el backend esté encendido y accesible desde tu red.`
    );
  }

  console.log(`[API Response] ${response.status} <- ${fullUrl}`);

  if (response.status === 401 && !isAuthEndpoint) {
    await storage.removeItem('mirroria_token');
    await storage.removeItem('mirroria_user');
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
    throw new ApiError(401, 'Sesión expirada');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as BackendErrorBody | null;
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new ApiError(response.status, message ?? 'Ocurrió un error inesperado');
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
