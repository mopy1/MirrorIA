import { API_URL } from '@/lib/config';
import { contextoHttp } from './contexto-http';
import { ApiError, ErrorSinRed } from './errores';

export type MetodoHttp = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface OpcionesFetch {
  metodo?: MetodoHttp;
  cuerpo?: unknown;
  /** `false` para rutas 🧭 de plataforma (`/saas/*`): sin `X-Tenant`. Un string fuerza esa tienda. */
  tenant?: boolean | string;
  /** `false` para no mandar el Bearer (login/registro). */
  auth?: boolean;
  idempotencyKey?: string;
  timeoutMs?: number;
}

export interface RespuestaApi<T> {
  datos: T;
  status: number;
  cabeceras: Headers;
}

/** Igual que `apiFetch` pero devuelve también status y cabeceras (X-Cache-Idempotency). */
export async function apiFetchCompleto<T>(ruta: string, op: OpcionesFetch = {}): Promise<RespuestaApi<T>> {
  if (contextoHttp.modoSinRed) throw new ErrorSinRed('Modo demo "Sin red" activo', 'modo-demo');
  if (contextoHttp.sinConexion) throw new ErrorSinRed();

  const cabeceras: Record<string, string> = { Accept: 'application/json' };
  if (op.cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  const tenant = typeof op.tenant === 'string' ? op.tenant : op.tenant === false ? null : contextoHttp.tenantSlug;
  if (tenant) cabeceras['X-Tenant'] = tenant;
  if (op.auth !== false && contextoHttp.token) cabeceras.Authorization = `Bearer ${contextoHttp.token}`;
  if (op.idempotencyKey) cabeceras['Idempotency-Key'] = op.idempotencyKey;

  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), op.timeoutMs ?? 15_000);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${ruta}`, {
      method: op.metodo ?? 'GET',
      headers: cabeceras,
      body: op.cuerpo === undefined ? undefined : JSON.stringify(op.cuerpo),
      signal: control.signal,
    });
  } catch {
    throw control.signal.aborted ? new ErrorSinRed('La tienda tardó demasiado', 'timeout') : new ErrorSinRed('Sin conexión con la tienda', 'red');
  } finally {
    clearTimeout(timer);
  }

  const texto = await res.text();
  const json = leerJson(texto);
  if (!res.ok) {
    const cuerpo = json && typeof json === 'object' ? (json as Record<string, unknown>) : null;
    const msg = cuerpo?.message;
    const mensaje = Array.isArray(msg) ? msg.join('. ') : typeof msg === 'string' ? msg : `Error ${res.status}`;
    if (res.status === 401 && op.auth !== false && contextoHttp.token) contextoHttp.alExpirarSesion?.();
    throw new ApiError(res.status, mensaje, cuerpo, res.headers);
  }
  return { datos: json as T, status: res.status, cabeceras: res.headers };
}

function leerJson(texto: string): unknown {
  try {
    return texto ? (JSON.parse(texto) as unknown) : null;
  } catch {
    return null;
  }
}

/** Cliente HTTP único de la app: X-Tenant, Bearer, Idempotency-Key, timeout 15 s. */
export async function apiFetch<T>(ruta: string, op: OpcionesFetch = {}): Promise<T> {
  return (await apiFetchCompleto<T>(ruta, op)).datos;
}
