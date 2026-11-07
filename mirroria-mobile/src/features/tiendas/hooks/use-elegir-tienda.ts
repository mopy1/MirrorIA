import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTienda } from '@/contexts/TiendaContext';
import type { TiendaDirectorio } from '../types/tienda.types';

/** Elegir una tienda: se guarda con su marca, se repinta la app y se va a la vitrina. */
export function useElegirTienda() {
  const { elegirTienda } = useTienda();
  const qc = useQueryClient();
  return async (t: TiendaDirectorio) => {
    if (!t.disponible) return;
    void Haptics.selectionAsync();
    await elegirTienda(t);
    void qc.invalidateQueries({ queryKey: ['espejo'] });
    router.replace('/vitrina');
  };
}
