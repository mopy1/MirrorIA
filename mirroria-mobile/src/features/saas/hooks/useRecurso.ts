import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/src/lib/api';

/** Carga un recurso al montar (si `activo`), con recarga y el mensaje real del backend en el error. */
export function useRecurso<T>(cargar: () => Promise<T>, activo = true, mensajeError = 'No se pudo cargar la información') {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(activo);
  const [error, setError] = useState<string | null>(null);
  const fn = useRef(cargar);
  fn.current = cargar;

  const reload = useCallback(async () => {
    if (!activo) return;
    setIsLoading(true);
    setError(null);
    try {
      setData(await fn.current());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : mensajeError);
    } finally {
      setIsLoading(false);
    }
  }, [activo, mensajeError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, setData, isLoading, error, reload };
}
