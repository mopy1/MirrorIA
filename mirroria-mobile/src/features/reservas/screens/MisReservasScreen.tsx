import { router } from 'expo-router';
import { CalendarPlus } from 'phosphor-react-native';
import * as React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { BadgeEstadoOutbox } from '@/components/common/BadgeEstadoOutbox';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { EstadoError } from '@/components/common/EstadoError';
import { EstadoVacio } from '@/components/common/EstadoVacio';
import { Pantalla } from '@/components/common/Pantalla';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useDiccionario } from '@/features/espejo/hooks/use-diccionario';
import { useCupo } from '@/features/vitrina/hooks/use-cupo';
import { enCurso } from '@/lib/outbox/consultas';
import { useOutbox } from '@/lib/outbox/use-outbox';
import { reservaActiva } from '@/lib/reservas/comprar-reserva';
import { BadgeEstadoReserva } from '../components/BadgeEstadoReserva';
import { TarjetaReserva } from '../components/TarjetaReserva';
import { useMisReservas } from '../hooks/use-mis-reservas';

const Seccion = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <View className="gap-2">
    <Text className="font-body-semibold text-xs uppercase tracking-wider text-muted-foreground">{titulo}</Text>
    {children}
  </View>
);

/** `mis-cosas/reservas`: las del servidor + las que esperan en la outbox (RN09), con el cupo arriba. */
export default function MisReservasScreen() {
  const q = useMisReservas();
  const dic = useDiccionario().data;
  const cupo = useCupo().data?.cupo;
  const encoladas = useOutbox().mias.filter((f) => f.tipo === 'RESERVA_CREAR' && enCurso(f));
  const todas = q.data?.datos ?? [];
  const activas = todas.filter((r) => reservaActiva(r.estado)).reverse();
  const anteriores = todas.filter((r) => !reservaActiva(r.estado));
  const prenda = (ids: string[]) => {
    const p = dic?.variantes.get(ids[0]);
    return p ? `${p.prenda} · ${p.talla}${ids.length > 1 ? ` y ${ids.length - 1} más` : ''}` : 'Reserva';
  };
  const sucursal = (id: string) => dic?.sucursales.get(id)?.nombre ?? 'Sucursal';
  const abrir = (id: string) => router.push({ pathname: '/mis-cosas/reservas/[reservaId]', params: { reservaId: id } });

  let cuerpo: React.ReactNode;
  if (q.isPending) cuerpo = <View className="gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} style={{ height: 88 }} />)}</View>;
  else if (q.isError && encoladas.length === 0) cuerpo = <EstadoError error={q.error} onReintentar={() => void q.refetch()} />;
  else if (todas.length === 0 && encoladas.length === 0)
    cuerpo = (
      <EstadoVacio icono={CalendarPlus} titulo="Todavía no reservaste" texto="Elegí una prenda en la vitrina y reservala para probártela en la sucursal.">
        <Button onPress={() => router.navigate('/vitrina')}>
          <Text>Ir a la vitrina</Text>
        </Button>
      </EstadoVacio>
    );
  else
    cuerpo = (
      <>
        {encoladas.length > 0 || activas.length > 0 ? (
          <Seccion titulo="Próximas">
            {encoladas.map((f) => (
              <TarjetaReserva key={f.id} fechaIso={String(f.payload.fechaHoraPrevista)} titulo={f.meta.prenda ?? 'Reserva'} detalle={f.meta.sucursalNombre ?? ''}
                badge={<BadgeEstadoOutbox estado={f.estado} texto="Se activa cuando se confirme" />} onPress={() => router.push({ pathname: '/mis-cosas/pendientes/[outboxId]', params: { outboxId: f.id } })} />
            ))}
            {activas.map((r) => (
              <TarjetaReserva key={r.id} fechaIso={r.fechaHoraPrevista} titulo={prenda(r.items.map((i) => i.varianteId))} detalle={sucursal(r.sucursalId)} badge={<BadgeEstadoReserva estado={r.estado} />} onPress={() => abrir(r.id)} />
            ))}
          </Seccion>
        ) : null}
        {anteriores.length > 0 ? (
          <Seccion titulo="Anteriores">
            {anteriores.map((r) => (
              <TarjetaReserva key={r.id} apagada fechaIso={r.fechaHoraPrevista} titulo={prenda(r.items.map((i) => i.varianteId))} detalle={sucursal(r.sucursalId)} badge={<BadgeEstadoReserva estado={r.estado} />} onPress={() => abrir(r.id)} />
            ))}
          </Seccion>
        ) : null}
      </>
    );

  return (
    <Pantalla>
      <EncabezadoPantalla titulo="Mis reservas" respaldo="/mis-cosas" />
      <ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-1" refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} />}>
        {cupo ? (
          <Text className="text-sm text-muted-foreground">
            {q.data?.guardado ? 'Sin conexión · ' : ''}
            <Text className="font-mono text-sm text-foreground">{cupo.reservasActivas} de {cupo.maxReservasActivas}</Text> reservas activas
          </Text>
        ) : null}
        {cuerpo}
      </ScrollView>
    </Pantalla>
  );
}
