import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/src/lib/api';
import { suscripcionApi } from '../api/suscripcionApi';
import type { EstadoCobroSuscripcionResponseDto } from '../types/suscripcion.types';

const INTERVALO_MS = 2500;

/** Pregunta cada 2,5 s si el banco ya avisó el pago del QR; también permite simularlo en pruebas. */
export function useEstadoCobroQr(cobroId: string | null, onPagado: () => void) {
  const [estado, setEstado] = useState<EstadoCobroSuscripcionResponseDto | null>(null);
  const [simulando, setSimulando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const aviso = useRef(onPagado);
  aviso.current = onPagado;

  useEffect(() => {
    setEstado(null);
    setError(null);
    if (!cobroId) return;
    let activo = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    async function consultar() {
      if (!activo || !cobroId) return;
      const res = await suscripcionApi.estadoCobro(cobroId).catch(() => null); // un corte de red suelto no tira la pantalla
      if (!activo) return;
      if (res) setEstado(res);
      if (res?.pagado) aviso.current();
      else timer = setTimeout(consultar, INTERVALO_MS);
    }
    void consultar();
    return () => {
      activo = false;
      if (timer) clearTimeout(timer);
    };
  }, [cobroId]);

  async function simular() {
    if (!cobroId) return;
    setSimulando(true);
    setError(null);
    try {
      const res = await suscripcionApi.simularPago(cobroId);
      setEstado(res);
      if (res.pagado) aviso.current();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al simular el pago');
    } finally {
      setSimulando(false);
    }
  }

  return { pagado: estado?.pagado ?? false, estado, simular, simulando, error };
}
