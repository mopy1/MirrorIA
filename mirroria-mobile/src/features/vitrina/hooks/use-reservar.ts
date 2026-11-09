import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import { useSesion } from '@/contexts/SesionContext';
import { useTienda } from '@/contexts/TiendaContext';
import { sucursalesParaReservar } from '@/lib/db/repos/reservas.repo';
import { diaHoraLaPaz } from '@/lib/formato/fechas';
import { enCurso } from '@/lib/outbox/consultas';
import { encolarReserva } from '@/lib/outbox/operaciones';
import { useOutbox } from '@/lib/outbox/use-outbox';
import { horariosReserva, type Horario } from '@/lib/reservas/horarios';
import { useCupo } from './use-cupo';
import { useFicha } from './use-ficha';

/** Reservar para probarme (CU09/CU10): sucursal + horario → `RESERVA_CREAR` encolado. */
export function useReservar(productoId: string, varianteId: string | undefined) {
  const { tienda } = useTienda();
  const { sesion } = useSesion();
  const ficha = useFicha(productoId);
  const cupo = useCupo();
  const encoladas = useOutbox().mias.filter((f) => f.tipo === 'RESERVA_CREAR' && enCurso(f)).length;
  const variante = ficha.data?.variantes.find((v) => v.id === varianteId) ?? ficha.data?.variantes[0];
  const [sucursalId, setSucursal] = React.useState<string | null>(null);
  const [horario, setHorario] = React.useState<Horario | null>(null);
  const [abierta] = React.useState(() => Date.now()); // hora en que se abrió la pantalla

  const sucursales = useQuery({
    queryKey: ['vitrina', 'reservables', tienda?.id, variante?.id],
    enabled: !!tienda && !!variante,
    networkMode: 'always',
    queryFn: () => sucursalesParaReservar(tienda!.id, variante!.id),
  });
  const c = cupo.data?.cupo;
  const horarios = React.useMemo(() => horariosReserva(abierta, c?.anticipacionMinimaMinutos, c?.ventanaMaximaHoras), [abierta, c?.anticipacionMinimaMinutos, c?.ventanaMaximaHoras]);
  const elegida = (sucursales.data ?? []).find((s) => s.sucursalId === sucursalId) ?? (sucursales.data ?? []).find((s) => s.reservable > 0) ?? null;
  const sinCupo = !!c && (!c.puedeReservar || c.reservasActivas + encoladas >= c.maxReservasActivas);

  const reservar = useMutation({
    networkMode: 'always',
    mutationFn: () =>
      encolarReserva({
        tenantId: tienda!.id, usuarioId: sesion!.usuario.id, sucursalId: elegida!.sucursalId, fechaHoraPrevista: horario!.iso, varianteId: variante!.id,
        meta: { productoId, prenda: ficha.data?.producto.titulo, talla: variante?.talla, color: variante?.color, sucursalNombre: elegida!.nombre, fechaHora: diaHoraLaPaz(horario!.ms) },
      }),
    onSuccess: (f) => router.replace({ pathname: '/vitrina/reserva/[outboxId]', params: { outboxId: f.id } }),
  });

  return { ficha, variante, cupo, encoladas, sinCupo, sucursales, elegida, elegirSucursal: setSucursal, horarios, horario, setHorario, reservar };
}
