import { useCallback, useState } from 'react';
import { ApiError } from '@/src/lib/api';
import { abrirYConfirmarAlVolver } from '@/src/features/payments/lib/pasarela-externa';
import { suscripcionApi } from '../api/suscripcionApi';
import { siguienteEstado, type EstadoRegreso } from '../lib/cobro';
import type { CobroSuscripcionResponseDto, PasarelaSuscripcion } from '../types/suscripcion.types';

/**
 * Cobro de la suscripción. QR (Wayra): devuelve el cobro para mostrar el
 * código. Stripe/PayPal: abre la pasarela con `expo-web-browser`; al cerrarla
 * (en el teléfono) se le pregunta a la API. En la web la pasarela abre en otra
 * pestaña y queda el botón "Ya pagué, revisar".
 */
export function useCobroSuscripcion(onPagado: () => void) {
  const [cobroQr, setCobroQr] = useState<CobroSuscripcionResponseDto | null>(null);
  const [regreso, setRegreso] = useState<{ cobroId: string; estado: EstadoRegreso } | null>(null);
  const [iniciando, setIniciando] = useState<PasarelaSuscripcion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirmar = useCallback(
    async (cobroId: string) => {
      setRegreso((r) => ({ cobroId, estado: r?.estado === 'pagado' ? 'pagado' : 'confirmando' }));
      try {
        const res = await suscripcionApi.confirmarCobro(cobroId);
        setRegreso((r) => ({ cobroId, estado: siguienteEstado(r?.estado ?? null, res) }));
        if (res.pagado) onPagado();
      } catch {
        setRegreso((r) => ({ cobroId, estado: r?.estado === 'pagado' ? 'pagado' : 'error' }));
      }
    },
    [onPagado],
  );

  async function iniciar(pasarela: PasarelaSuscripcion, planCodigo: string) {
    setIniciando(pasarela);
    setError(null);
    try {
      const res = await suscripcionApi.iniciarCobro({ pasarela, planCodigo });
      if (res.modo === 'REDIRECT' && res.url) {
        setRegreso({ cobroId: res.cobroId, estado: 'esperando' });
        await abrirYConfirmarAlVolver(res.url, () => confirmar(res.cobroId));
        return;
      }
      setCobroQr(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar el cobro');
    } finally {
      setIniciando(null);
    }
  }

  return {
    cobroQr,
    cerrarQr: () => setCobroQr(null),
    regreso,
    setRegreso,
    confirmar,
    iniciar,
    iniciando,
    error,
  };
}
