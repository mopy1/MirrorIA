import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import * as React from 'react';
import { useDiccionario } from '@/features/espejo/hooks/use-diccionario';
import { useMisVentas } from '@/features/pedidos/hooks/use-mis-ventas';
import { horaLaPaz } from '@/lib/formato/fechas';
import { accionPase, codigoPase, momentoRecordatorio } from '@/lib/reservas/comprar-reserva';
import { useEstadoRed } from '@/lib/red/use-estado-red';
import { cancelarReserva } from '../api/reservas.api';
import { useComprarReserva } from './use-comprar-reserva';
import { useReserva } from './use-mis-reservas';
import { useRecordatorio } from './use-recordatorio';

/** Pase de Tienda: reserva (refresco 15 s + al enfocar), acción primaria, recordatorio, compra y cancelación. */
export function usePase(reservaId: string | undefined) {
  const qc = useQueryClient();
  const red = useEstadoRed();
  const q = useReserva(reservaId);
  const ventas = useMisVentas();
  const dic = useDiccionario().data;
  const recordatorio = useRecordatorio(reservaId);
  const comprar = useComprarReserva(reservaId);
  const { refetch } = q;
  useFocusEffect(React.useCallback(() => void refetch(), [refetch]));

  const reserva = q.data?.reserva;
  const sucursal = reserva ? dic?.sucursales.get(reserva.sucursalId) : undefined;
  const recordatorioEn = reserva ? momentoRecordatorio(reserva.fechaHoraPrevista) : null;
  const accion = reserva
    ? accionPase({ estado: reserva.estado, online: red.online, ventas: ventas.data?.datos ?? [], reservaId: reserva.id, recordatorioEn })
    : null;
  const subtotalCents = reserva?.items.reduce((s, i) => s + (dic?.variantes.get(i.varianteId)?.precioCents ?? 0) * i.cantidad, 0) ?? 0;

  // Ya en la tienda (o cerrada): el recordatorio sobra y se quita solo.
  const sobraRecordatorio = !!reserva && !!recordatorio.actual && reserva.estado !== 'PENDIENTE' && reserva.estado !== 'CONFIRMADA';
  const { mutate: quitarRecordatorio } = recordatorio.quitar;
  React.useEffect(() => {
    if (sobraRecordatorio) quitarRecordatorio();
  }, [sobraRecordatorio, quitarRecordatorio]);

  const cancelar = useMutation({
    mutationFn: () => cancelarReserva(reservaId!),
    onSuccess: async () => {
      if (recordatorio.actual) recordatorio.quitar.mutate();
      await qc.invalidateQueries({ queryKey: ['reservas'] });
    },
  });

  const programarRecordatorio = () => {
    if (!reserva || recordatorioEn === null) return;
    recordatorio.programar.mutate({
      en: recordatorioEn,
      titulo: 'Tu cita para probarte es en 1 hora',
      cuerpo: `${sucursal?.nombre ?? 'En la sucursal'} a las ${horaLaPaz(Date.parse(reserva.fechaHoraPrevista))}. Mostrá tu pase #${codigoPase(reserva.id)} en caja.`,
    });
  };

  return { q, reserva, guardado: q.data?.guardado ?? false, sucursal, dic, accion, subtotalCents, online: red.online, recordatorio, programarRecordatorio, comprar, cancelar };
}
