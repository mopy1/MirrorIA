import { useCallback, useEffect, useState } from 'react';

/** Pedir una lista al montar y bajo demanda (el useResourceList de la web, con dependencias). */
export function useLista<T>(pedir: () => Promise<T[]>, habilitado: boolean, deps: unknown[] = []) {
  const [items, setItems] = useState<T[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fn = useCallback(pedir, deps);

  useEffect(() => {
    if (!habilitado) return;
    let cancelado = false;
    setCargando(true);
    setError(null);
    fn()
      .then((d) => !cancelado && setItems(d))
      .catch(() => !cancelado && setError('No se pudo cargar la lista'))
      .finally(() => !cancelado && setCargando(false));
    return () => {
      cancelado = true;
    };
  }, [fn, habilitado, version]);

  return { items, cargando, error, recargar: () => setVersion((v) => v + 1) };
}
