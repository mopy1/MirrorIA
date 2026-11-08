import React, { useMemo } from 'react';
import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { EtiquetaTono } from '@/src/features/dashboard/components/comun/EtiquetaTono';
import { useAuth } from '@/src/hooks/useAuth';
import { accionCita, contar, humanizarFactor, limpiarNombreClienta, normalizarProbabilidad, vendraCita } from '../lib/ml-lenguaje';
import type { ItemEvaluacionNoShow, NoShowAgendaResponse } from '../types/ml.types';
import { BloqueMl } from './BloqueMl';

function Fila({ item, tienda }: { item: ItemEvaluacionNoShow; tienda: string }) {
  const nombre = limpiarNombreClienta(item.cliente_nombre);
  const v = vendraCita(item.probabilidad_no_show);
  const motivos = (item.factores_clave ?? []).map(humanizarFactor);
  const tel = item.cliente_telefono?.replace(/\D/g, '');
  const mensaje = `Hola ${nombre}, te escribimos de ${tienda} para confirmar tu cita de probador${item.hora_prevista ? ` de hoy a las ${item.hora_prevista}` : ''}. ¿Nos confirmás que venís?`;
  const wa = tel ? `https://wa.me/${tel.length <= 8 ? `591${tel}` : tel}?text=${encodeURIComponent(mensaje)}` : null;

  return (
    <View className="gap-1.5 border-t border-border/70 pt-3">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-sm font-medium">
          {item.hora_prevista ?? 'Hoy'} · {nombre}
        </Text>
        <EtiquetaTono tono={v.tono}>{v.etiqueta}</EtiquetaTono>
      </View>
      {typeof item.prendas_apartadas_count === 'number' && item.prendas_apartadas_count > 0 ? (
        <Text className="text-xs text-muted-foreground">{contar(item.prendas_apartadas_count, 'prenda apartada', 'prendas apartadas')}</Text>
      ) : null}
      {motivos.length > 0 ? <Text className="text-sm text-muted-foreground">{motivos.join(' · ')}</Text> : null}
      <Text className="text-sm">{accionCita(item.accion_recomendada, item.probabilidad_no_show)}</Text>
      {wa && v.enRiesgo ? (
        <Button size="sm" variant="outline" className="self-start" onPress={() => void Linking.openURL(wa)}>
          <Icon as={MessageCircle} size={16} className="text-emerald-600" />
          <Text>Reconfirmar</Text>
        </Button>
      ) : null}
    </View>
  );
}

interface Props {
  data: NoShowAgendaResponse | null;
  isLoading: boolean;
  error: string | null;
  onReintentar: () => void;
  limite?: number;
  onVerTodo?: () => void;
}

/** "Citas en riesgo": las citas de hoy, primero las que pueden fallar, con qué hacer. */
export function SeccionCitas({ data, isLoading, error, onReintentar, limite, onVerTodo }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const tienda = user?.tenant?.nombre || 'la tienda';
  const citas = useMemo(
    () => [...(data?.evaluaciones ?? [])].sort((a, b) => normalizarProbabilidad(b.probabilidad_no_show) - normalizarProbabilidad(a.probabilidad_no_show)),
    [data]
  );
  const enRiesgo = citas.filter((c) => vendraCita(c.probabilidad_no_show).enRiesgo).length;
  const frase =
    data && citas.length > 0
      ? enRiesgo > 0
        ? `De ${contar(citas.length, 'cita', 'citas')} de hoy, ${enRiesgo === 1 ? '1 puede fallar' : `${enRiesgo} pueden fallar`}. Un mensaje a tiempo suele salvarla${enRiesgo === 1 ? '' : 's'}.`
        : citas.length === 1
          ? 'La cita de hoy parece segura: no hace falta reconfirmar.'
          : `Las ${citas.length} citas de hoy parecen seguras: no hace falta reconfirmar.`
      : undefined;

  return (
    <BloqueMl
      titulo="Citas en riesgo"
      frase={frase}
      enlace={onVerTodo ? { texto: 'Ver todas', onPress: onVerTodo } : { texto: 'Ir a Reservas', onPress: () => router.push('/admin/reservas') }}
      isLoading={isLoading}
      error={error}
      hayDatos={!!data}
      que="las citas de hoy"
      onReintentar={onReintentar}
      vacio={citas.length === 0 ? { titulo: 'No hay citas de probador para hoy', detalle: 'Cuando una clienta reserve una prenda para probársela, acá vas a ver si es probable que venga y qué hacer si no.' } : null}>
      {(limite ? citas.slice(0, limite) : citas).map((c) => (
        <Fila key={c.reserva_id} item={c} tienda={tienda} />
      ))}
    </BloqueMl>
  );
}
