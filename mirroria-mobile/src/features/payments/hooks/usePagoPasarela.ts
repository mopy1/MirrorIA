import { useCallback, useState } from 'react';
import { ApiError } from '@/src/lib/api';
import { cartApi } from '@/src/features/cart/api/cartApi';
import type { VentaResponseDto } from '@/src/features/cart/types/cart.types';
import { pagosApi } from '../api/pagosApi';
import { abrirYConfirmarAlVolver } from '../lib/pasarela-externa';
import { resultadoDeVenta, type ResultadoVenta } from '../lib/metodos-pago';

export type Pasarela = 'TARJETA' | 'PAYPAL';

/**
 * Pagar una compra con Stripe o PayPal: se pide la URL de la pasarela, se
 * abre con `expo-web-browser` y, al volver a la app, se le pide al servidor
 * que confirme con la pasarela (PayPal recién cobra ahí) y se lee el estado
 * real de la venta. La URL de regreso no prueba nada por sí sola.
 */
export function usePagoPasarela(ventaId: string, onVenta: (v: VentaResponseDto) => void) {
  const [abriendo, setAbriendo] = useState<Pasarela | null>(null);
  const [esperando, setEsperando] = useState<Pasarela | null>(null);
  const [revisando, setRevisando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoVenta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const revisar = useCallback(async () => {
    setRevisando(true);
    setError(null);
    try {
      await pagosApi.confirmarPasarela(ventaId).catch(() => null);
      const v = await cartApi.getVenta(ventaId);
      onVenta(v);
      const r = resultadoDeVenta(v.estado);
      setResultado(r);
      if (r !== 'pendiente') setEsperando(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo consultar tu compra');
    } finally {
      setRevisando(false);
    }
  }, [ventaId, onVenta]);

  async function pagar(pasarela: Pasarela) {
    setAbriendo(pasarela);
    setError(null);
    setResultado(null);
    try {
      const { url } = pasarela === 'PAYPAL' ? await pagosApi.iniciarPaypal(ventaId) : await pagosApi.iniciarTarjeta(ventaId);
      if (!url) throw new ApiError(502, 'La pasarela no devolvió a dónde ir. Probá con otro medio.');
      setEsperando(pasarela);
      await abrirYConfirmarAlVolver(url, revisar);
    } catch (err) {
      // P. ej. 503 si el servidor no tiene claves de Stripe/PayPal: se muestra tal cual y se puede elegir otro medio.
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar el pago en línea');
    } finally {
      setAbriendo(null);
    }
  }

  return { pagar, revisar, abriendo, esperando, revisando, resultado, error, cancelar: () => setEsperando(null) };
}
