import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { Seccion } from '@/components/admin/Seccion';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { EtiquetaTono } from '@/src/features/dashboard/components/comun/EtiquetaTono';
import type { PrediccionesMl } from '../hooks/usePrediccionesMl';
import { armarAccionesSemana, fraseSemana } from '../lib/ml-acciones';
import { armarKpis } from '../lib/ml-kpis';
import type { TabPrediccion } from '../lib/ml-tabs';
import { SeccionCitas } from './SeccionCitas';
import { SeccionReponer } from './SeccionReponer';

const ETIQUETA = { critico: 'Urgente', alerta: 'Pronto', atencion: 'Esta semana', bien: 'Al día' } as const;
const COLOR = { bien: 'text-foreground', atencion: 'text-amber-700', alerta: 'text-orange-700', critico: 'text-rose-700' } as const;

/** Resumen: qué hacer esta semana, los 4 números y lo más urgente de reponer y de citas. */
export function VistaResumenMl({ p, onIrA }: { p: PrediccionesMl; onIrA: (t: TabPrediccion) => void }) {
  const { demanda, noShow, rfm, anomalias, nombres, permitidas } = p;
  const datos = useMemo(
    () => ({ demanda: demanda.data, noShow: noShow.data, rfm: rfm.data, anomalias: anomalias.data, nombres }),
    [demanda.data, noShow.data, rfm.data, anomalias.data, nombres]
  );
  const acciones = useMemo(() => armarAccionesSemana(datos), [datos]);
  // La encargada no ve los números de clientas y ventas (son solo de la dueña).
  const kpis = useMemo(
    () => armarKpis(datos).filter((k) => (k.tab === 'rfm' ? permitidas.rfm : k.tab === 'auditoria' ? permitidas.anomalias : true)),
    [datos, permitidas.rfm, permitidas.anomalias]
  );

  return (
    <View className="gap-4">
      <Seccion titulo="Qué hacer esta semana">
        <Text className="text-[15px] leading-6">{fraseSemana(acciones)}</Text>
        {acciones.length === 0 ? (
          <View className="flex-row items-center gap-2">
            <Icon as={CheckCircle2} size={16} className="text-emerald-600" />
            <Text className="flex-1 text-sm text-muted-foreground">
              Te avisamos aquí apenas una prenda empiece a escasear o una cita esté en riesgo.
            </Text>
          </View>
        ) : (
          acciones.map((a) => (
            <View key={a.id} className="gap-1.5 border-t border-border/70 pt-3">
              <EtiquetaTono tono={a.tono}>{ETIQUETA[a.tono]}</EtiquetaTono>
              <Text className="text-sm font-medium">{a.titulo}</Text>
              <Text className="text-sm text-muted-foreground">{a.detalle}</Text>
              <Pressable onPress={() => onIrA(a.tab)} hitSlop={8} className="flex-row items-center gap-1 self-start py-1">
                <Text className="text-sm font-semibold text-primary">{a.boton}</Text>
                <Icon as={ArrowRight} size={14} className="text-primary" />
              </Pressable>
            </View>
          ))
        )}
      </Seccion>

      <View className="flex-row flex-wrap gap-3">
        {kpis.map((k) => (
          <Pressable
            key={k.id}
            onPress={() => onIrA(k.tab)}
            className="min-w-[45%] flex-1 gap-1 rounded-2xl border border-border bg-card p-4 active:bg-muted">
            <Text className="text-xs text-muted-foreground">{k.titulo}</Text>
            <Text className={cn('text-2xl font-bold', COLOR[k.tono])}>{k.valor}</Text>
            <Text className="text-xs text-muted-foreground">{k.detalle}</Text>
            <Text className="text-xs font-semibold text-primary">Ver detalle ›</Text>
          </Pressable>
        ))}
      </View>

      <SeccionReponer data={demanda.data} nombres={nombres} isLoading={demanda.isLoading} error={demanda.error} onReintentar={() => void demanda.reload()} limite={4} onVerTodo={() => onIrA('demanda')} />
      <SeccionCitas data={noShow.data} isLoading={noShow.isLoading} error={noShow.error} onReintentar={() => void noShow.reload()} limite={3} onVerTodo={() => onIrA('noshow')} />
    </View>
  );
}
