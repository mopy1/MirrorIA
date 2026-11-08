import { useFocusEffect } from 'expo-router';
import * as React from 'react';
import { useMisVentas } from '@/features/pedidos/hooks/use-mis-ventas';
import { useMisReservas } from '@/features/reservas/hooks/use-mis-reservas';
import { useCupo } from '@/features/vitrina/hooks/use-cupo';
import { resumenClienta } from '@/lib/pagos/resumen-clienta';

/** KPIs del dashboard con las mismas fuentes que la web (`/ventas/mias`, `/reservas/mias`, cupo). Sin red: lo guardado. */
export function useResumenClienta() {
  const ventas = useMisVentas();
  const reservas = useMisReservas();
  const cupoQ = useCupo();
  const cupo = cupoQ.data?.cupo ?? null;
  const cargando = ventas.isPending || reservas.isPending;
  const resumen = resumenClienta(ventas.data?.datos ?? [], reservas.data?.datos ?? []);
  const { refetch: rv } = ventas;
  const { refetch: rr } = reservas;
  const { refetch: rc } = cupoQ;
  const refrescar = React.useCallback(() => Promise.all([rv(), rr(), rc()]), [rv, rr, rc]);
  // Al volver a la tab (p. ej. después de pagar o de que la cajera confirme) los números se ponen al día.
  useFocusEffect(React.useCallback(() => void refrescar(), [refrescar]));
  // El spinner del pull-to-refresh solo cuando la clienta tira (no en cada foco).
  const [tirando, setTirando] = React.useState(false);
  const tirar = () => {
    setTirando(true);
    void refrescar().finally(() => setTirando(false));
  };
  return { resumen, cupo, cargando, guardado: !!(ventas.data?.guardado || reservas.data?.guardado), refrescando: tirando, refrescar: tirar };
}
