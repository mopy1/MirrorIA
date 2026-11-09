/** Error HTTP del backend: `{ status, message, codigo?, detalles?, timestamp }`. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly cuerpo: Record<string, unknown> | null,
    readonly cabeceras: Headers | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get codigo(): string | undefined {
    const c = this.cuerpo?.codigo;
    return typeof c === 'string' ? c : undefined;
  }
}

/**
 * La request no salió o no volvió: sin conexión, modo demo "Sin red", servidor
 * inalcanzable o timeout. Nunca es un rechazo del servidor (para la outbox = reintentar).
 */
export class ErrorSinRed extends Error {
  constructor(
    message = 'Sin conexión',
    readonly motivo: 'offline' | 'modo-demo' | 'timeout' | 'red' = 'offline',
  ) {
    super(message);
    this.name = 'ErrorSinRed';
  }
}

/** Mensaje para la UI a partir de cualquier error. */
export function mensajeDeError(e: unknown): string {
  if (e instanceof ErrorSinRed) return 'No hay conexión con la tienda. Probá de nuevo cuando vuelva la red.';
  if (e instanceof ApiError && e.status === 401) return 'Tu sesión venció. Iniciá sesión de nuevo para seguir.';
  if (e instanceof ApiError) return e.message;
  return 'Algo salió mal. Probá de nuevo.';
}
