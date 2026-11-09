import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { useVenta } from '@/features/pedidos/hooks/use-mis-ventas';
import { borrarConfig, escribirConfig, leerConfigJson } from '@/lib/db/repos/configuracion.repo';
import { bloqueoPago, intervaloConsulta, metodosDisponibles, vistaPago, type MetodoPagoApp } from '@/lib/pagos/estado-pago';
import { useEstadoRed } from '@/lib/red/use-estado-red';
import {
  cancelarVenta, consultarQr, iniciarEfectivo, iniciarQr, iniciarTarjeta, listarPasarelas,
  type CobroQrDto, type InstruccionesDto,
} from '../api/pagos.api';

/** Cobro ya iniciado de esta venta (se guarda en SQLite: al volver a la pantalla se ve la misma referencia/QR). */
export type Cobro = { metodo: 'QR'; qr: CobroQrDto } | { metodo: 'EFECTIVO'; caja: InstruccionesDto } | { metodo: 'TARJETA' };

/**
 * Pantalla de pago (M3.1). La app nunca da por pagado nada: consulta `GET /ventas/:id` (y el QR)
 * hasta que el backend lo acredita (aviso de Wayra, webhook de Stripe o la cajera en la web).
 */
export function usePago(ventaId: string | undefined) {
  const qc = useQueryClient();
  const red = useEstadoRed();
  const [cobro, setCobro] = React.useState<Cobro | null>(null);
  const [elegido, setElegido] = React.useState<MetodoPagoApp | null>(null);
  const claveCobro = `cobro:${ventaId}` as const;

  React.useEffect(() => {
    if (ventaId) void leerConfigJson<Cobro>(claveCobro).then((c) => c && setCobro(c));
  }, [ventaId, claveCobro]);

  const qr = useQuery({
    queryKey: ['pagos', 'qr', cobro?.metodo === 'QR' ? cobro.qr.pagoId : null],
    enabled: cobro?.metodo === 'QR' && red.online,
    queryFn: () => consultarQr((cobro as { qr: CobroQrDto }).qr.pagoId),
    refetchInterval: (q) => (q.state.data?.estado === 'PENDIENTE' || !q.state.data ? 3_000 : false),
  });
  const estadoQr = qr.data?.estado ?? null;
  // Rápido con un cobro en curso; cada 30 s mientras elige (la compra puede vencer o pagarse desde la web).
  const venta = useVenta(ventaId, (v) =>
    intervaloConsulta({ estadoVenta: v?.estado, iniciado: cobro?.metodo ?? null, estadoQr, online: red.online }) ||
    (red.online && v?.estado === 'PENDIENTE' ? 30_000 : false),
  );
  const vista = vistaPago({ estadoVenta: venta.data?.estado, iniciado: cobro?.metodo ?? null, estadoQr });

  const pasarelas = useQuery({ queryKey: ['pagos', 'pasarelas'], queryFn: listarPasarelas, staleTime: 10 * 60_000 });
  const metodos = metodosDisponibles(pasarelas.isError ? undefined : pasarelas.data);
  const metodo = elegido ?? cobro?.metodo ?? metodos[0] ?? null;

  const guardar = async (c: Cobro) => {
    setCobro(c);
    await escribirConfig(claveCobro, JSON.stringify(c));
  };
  const iniciar = useMutation({
    mutationFn: async (m: MetodoPagoApp) => {
      if (m === 'QR') return guardar({ metodo: 'QR', qr: await iniciarQr(ventaId!) });
      if (m === 'EFECTIVO') return guardar({ metodo: 'EFECTIVO', caja: await iniciarEfectivo(ventaId!) });
      const { url } = await iniciarTarjeta(ventaId!);
      await guardar({ metodo: 'TARJETA' });
      await WebBrowser.openBrowserAsync(url);
      await venta.refetch();
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['pagos', 'qr'] }),
  });
  const cancelar = useMutation({
    mutationFn: () => cancelarVenta(ventaId!),
    onSuccess: async () => {
      await borrarConfig(claveCobro);
      await qc.invalidateQueries({ queryKey: ['ventas'] });
    },
  });

  // Al acreditarse: háptico + refrescar pedidos, reservas (la reserva pasa a COMPLETADA) y el espejo (stock).
  const avisado = React.useRef(false);
  React.useEffect(() => {
    if (vista !== 'PAGADA' || avisado.current) return;
    avisado.current = true;
    if (cobro) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void borrarConfig(claveCobro);
    if (venta.data && venta.data.estado === 'PENDIENTE') void venta.refetch();
    void qc.invalidateQueries({ queryKey: ['ventas', 'mias'] });
    void qc.invalidateQueries({ queryKey: ['reservas'] });
    void qc.invalidateQueries({ queryKey: ['espejo'] });
  }, [vista, cobro, claveCobro, qc, venta]);

  const revisar = () => {
    void venta.refetch();
    void qc.invalidateQueries({ queryKey: ['pagos', 'qr'] });
  };
  return {
    venta, vista, cobro, metodos, metodo, elegir: setElegido, iniciar, cancelar, revisar, estadoQr,
    bloqueo: bloqueoPago(red.online, venta.data?.estado), online: red.online,
  };
}
