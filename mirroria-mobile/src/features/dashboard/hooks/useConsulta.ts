import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carga datos con estado de carga/error y recarga manual. Si cambian las dependencias,
 * se descarta la respuesta vieja (no pisa a la nueva). `enabled=false` no llama a la API.
 */
export function useConsulta<T>(fn: () => Promise<T>, deps: unknown[], enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const turno = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cargar = useCallback(fn, deps);

  const recargar = useCallback(async () => {
    if (!enabled) return;
    const mio = ++turno.current;
    setIsLoading(true);
    setError(null);
    try {
      const res = await cargar();
      if (mio === turno.current) setData(res);
    } catch (err) {
      if (mio === turno.current) setError(err instanceof Error ? err.message : 'No pudimos cargar los datos');
    } finally {
      if (mio === turno.current) setIsLoading(false);
    }
  }, [cargar, enabled]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { data, isLoading, error, recargar };
}
