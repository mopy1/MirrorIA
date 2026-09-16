import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';

/**
 * Orígenes permitidos vía env var CORS_ORIGINS, separados por coma
 * (mismo patrón que `cors.allowed-origins` en erp-backend / case-backend).
 * Sin la env var, solo permite el puerto local por defecto de Vite (mirroria-frontend).
 */
export function buildCorsOptions(): CorsOptions {
  const raw = process.env.CORS_ORIGINS ?? 'http://localhost:5174,http://localhost:8081,http://127.0.0.1:8081';
  const origins = raw.split(',').map((origin) => origin.trim());

  return {
    origin: (origin, callback) => {
      // Permite solicitudes sin Origin (apps móviles nativas, mobile WebView, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }
      // En desarrollo permite cualquier origen local o los definidos en CORS_ORIGINS
      if (
        process.env.NODE_ENV !== 'production' ||
        origins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://172.') ||
        origin.endsWith('.ngrok-free.app') ||
        origin.endsWith('.ngrok.app') ||
        origin.endsWith('.exp.direct')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origen ${origin} bloqueado por CORS`));
    },
    credentials: true,
  };
}
