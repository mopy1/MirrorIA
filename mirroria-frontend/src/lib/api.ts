const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1"

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface BackendErrorBody {
  status: number
  message: string | string[]
  timestamp: string
}

/**
 * fetch envuelto con: URL base, JSON automático, Bearer token desde
 * localStorage, y manejo de errores con el shape único del backend
 * ({ status, message, timestamp } — ver GlobalExceptionFilter en
 * mirroria-backend). Ante un 401 de un endpoint protegido, limpia la sesión
 * y manda a /login — pero NO para /seguridad/auth/* : un 401 ahí es
 * "credenciales incorrectas" (login/register fallando), no una sesión que
 * expiró, y no hay ninguna sesión que limpiar todavía.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("mirroria_token")
  const isAuthEndpoint = path.startsWith("/seguridad/auth/")

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401 && !isAuthEndpoint) {
    localStorage.removeItem("mirroria_token")
    localStorage.removeItem("mirroria_user")
    if (window.location.pathname !== "/login") {
      window.location.href = "/login"
    }
    throw new ApiError(401, "Sesión expirada")
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as BackendErrorBody | null
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message
    throw new ApiError(response.status, message ?? "Ocurrió un error inesperado")
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
