import { useState } from 'react';
import { ApiError } from '@/src/lib/api';
import { wayraApi } from '../api/suscripcionApi';
import type { CobroWayra, ComprobanteWayra } from '../types/suscripcion.types';

export type PasoWayra = 'cerrado' | 'cargando' | 'cuenta' | 'procesando' | 'comprobante';

/**
 * La "app del banco" Wayra (simulado), dentro del teléfono: ver el cobro del
 * QR, elegir la cuenta, poner el PIN (cualquier 4 dígitos) y recibir el
 * comprobante. El backend acredita la suscripción cuando el banco avisa.
 */
export function usePagoWayra(token: string | undefined) {
  const [paso, setPaso] = useState<PasoWayra>('cerrado');
  const [cobro, setCobro] = useState<CobroWayra | null>(null);
  const [cuentaId, setCuentaId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [comprobante, setComprobante] = useState<ComprobanteWayra | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function abrir() {
    if (!token) return;
    setPaso('cargando');
    setError(null);
    try {
      const c = await wayraApi.verCobro(token);
      setCobro(c);
      setCuentaId(c.cuentas[0]?.id ?? null);
      setPaso('cuenta');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo abrir el cobro en el banco');
      setPaso('cerrado');
    }
  }

  async function pagar() {
    if (!token || !cuentaId) return;
    if (!/^\d{4}$/.test(pin)) {
      setError('El PIN son 4 dígitos');
      return;
    }
    setPaso('procesando');
    setError(null);
    try {
      setComprobante(await wayraApi.pagar(token, cuentaId, pin));
      setPaso('comprobante');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo completar el pago. Intentá de nuevo.');
      const actualizado = await wayraApi.verCobro(token).catch(() => null);
      if (actualizado) setCobro(actualizado);
      setPaso('cuenta');
    }
  }

  return { paso, cobro, cuentaId, setCuentaId, pin, setPin, comprobante, error, abrir, pagar, cerrar: () => setPaso('cerrado') };
}
