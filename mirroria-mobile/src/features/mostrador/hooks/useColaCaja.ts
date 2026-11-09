import { useCallback, useEffect, useState } from 'react';
import { baseLocal } from '@/src/lib/offline/expoBase';
import {
  marcarAtendida, vendidoSinReflejar, ventasFallidasSinAtender, ventasPendientes, type VentaCaja,
} from '@/src/lib/offline/colaCaja';
import { alCambiarCaja, avisarCambioCaja } from '../lib/eventos-caja';

interface Params {
  tienda: string;
  usuarioId: string | undefined;
  sucursalId: string | null;
  fotoTomadaEn: number | null;
}

/** Estado de la cola de la caja en este teléfono: pendientes, avisos de fallidas y lo vendido sin reflejar. */
export function useColaCaja({ tienda, usuarioId, sucursalId, fotoTomadaEn }: Params) {
  const [pendientes, setPendientes] = useState<VentaCaja[]>([]);
  const [fallidas, setFallidas] = useState<VentaCaja[]>([]);
  const [vendido, setVendido] = useState<Record<string, number>>({});

  const refrescar = useCallback(async () => {
    if (!usuarioId) return;
    const db = await baseLocal();
    const cajera = { tienda, usuarioId };
    setPendientes(await ventasPendientes(db, cajera));
    setFallidas(await ventasFallidasSinAtender(db, cajera));
    setVendido(sucursalId && fotoTomadaEn !== null ? await vendidoSinReflejar(db, tienda, sucursalId, fotoTomadaEn) : {});
  }, [tienda, usuarioId, sucursalId, fotoTomadaEn]);

  useEffect(() => {
    void refrescar();
    return alCambiarCaja(() => void refrescar());
  }, [refrescar]);

  const atender = useCallback(async (id: string) => {
    await marcarAtendida(await baseLocal(), id);
    avisarCambioCaja();
  }, []);

  return { pendientes, fallidas, vendido, refrescar, atender };
}
