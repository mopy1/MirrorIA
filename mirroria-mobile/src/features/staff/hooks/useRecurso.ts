import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/src/lib/api';

/** Trae un recurso de la API con estado de carga, error y recarga (pull-to-refresh). */
export function useRecurso<T>(traer: () => Promise<T>, inicial: T, clave = '') {
  const [datos, setDatos] = useState<T>(inicial);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fn = useRef(traer);
  fn.current = traer;

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await fn.current());
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 0
          ? 'Sin conexión. Deslizá hacia abajo para reintentar.'
          : e instanceof Error ? e.message : 'No se pudo cargar',
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar, clave]);

  return { datos, setDatos, cargando, error, recargar };
}
