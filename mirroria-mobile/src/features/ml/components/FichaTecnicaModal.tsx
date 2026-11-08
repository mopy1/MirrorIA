import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, LineChart, X } from 'lucide-react-native';
import { Cargando } from '@/components/admin/Estados';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { DatosPredicciones } from '../lib/ml-acciones';
import { formatearModelos } from '../lib/ml-ficha';
import type { MetricasModelosResponse } from '../types/ml.types';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  metricas: MetricasModelosResponse | null;
  cargandoMetricas: boolean;
  datos: DatosPredicciones;
  esEstimacion: boolean;
}

function filasIndicadores({ demanda, noShow, rfm, anomalias }: DatosPredicciones, esEstimacion: boolean): [string, string][] {
  return [
    ['Origen', esEstimacion ? 'Heurística de respaldo (fallback: el microservicio no respondió)' : 'Inferencia en vivo · microservicio FastAPI :8002'],
    ['M1 · Stockout rate proyectado', demanda ? `${demanda.kpis_resumen.quiebre_stock_rate_pct}%` : '—'],
    ['M1 · Rotación proyectada', demanda ? `${demanda.kpis_resumen.rotacion_proyectada}x (horizonte ${demanda.horizonte_dias} d)` : '—'],
    ['M2 · Tasa de No-Show esperada', noShow ? `${noShow.tasa_no_show_esperada_pct}%` : '—'],
    ['M2 · Alertas críticas (p ≥ 0.65)', noShow ? String(noShow.alertas_criticas_count) : '—'],
    ['M3 · Retención estimada (CRR)', rfm ? `${rfm.tasa_retencion_estimada_pct}%` : '—'],
    ['M3 · CLV promedio', rfm ? `Bs ${rfm.clv_promedio_bs.toLocaleString('es-BO')}` : '—'],
    ['M4 · Tasa de anomalías', anomalias ? `${anomalias.tasa_anomalias_pct}% (${anomalias.anomalias_detectadas}/${anomalias.total_analizadas})` : '—'],
  ];
}

/** "¿Cómo se calcula?": el único lugar con jerga técnica (modelos, métricas y citas, para la defensa SI2). */
export function FichaTecnicaModal({ abierto, onCerrar, metricas, cargandoMetricas, datos, esEstimacion }: Props) {
  return (
    <Modal visible={abierto} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCerrar}>
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Text className="text-lg font-semibold">¿Cómo se calcula?</Text>
          <Pressable onPress={onCerrar} hitSlop={10} accessibilityLabel="Cerrar" className="h-9 w-9 items-center justify-center rounded-full active:bg-muted">
            <Icon as={X} size={20} />
          </Pressable>
        </View>
        <ScrollView contentContainerClassName="gap-5 p-4 pb-10">
          <Text className="text-sm text-muted-foreground">
            Cada predicción sale de un modelo de aprendizaje automático entrenado con datos de la tienda. Acá está la ficha
            técnica: algoritmos, métricas de evaluación y referencias.
          </Text>
          <View className="gap-2">
            <Text className="text-sm font-semibold">Indicadores de los modelos</Text>
            <View className="rounded-xl border border-border">
              {filasIndicadores(datos, esEstimacion).map(([k, v], i) => (
                <View key={k} className={i > 0 ? 'gap-0.5 border-t border-border px-3 py-2' : 'gap-0.5 px-3 py-2'}>
                  <Text className="text-xs text-muted-foreground">{k}</Text>
                  <Text className="text-xs font-medium">{v}</Text>
                </View>
              ))}
            </View>
          </View>
          <View className="gap-2">
            <Text className="text-sm font-semibold">Ficha técnica y citas académicas (SI2)</Text>
            {cargandoMetricas && !metricas ? (
              <Cargando />
            ) : (
              <>
                <Text className="text-xs text-muted-foreground">
                  seed={metricas?.semilla_reproducible ?? 42} · N={(metricas?.dataset_size_total ?? 10000).toLocaleString('es-BO')}
                  {metricas?.fecha_evaluacion ? ` · Evaluado: ${metricas.fecha_evaluacion}` : ''}
                </Text>
                {formatearModelos(metricas).map((m) => (
                  <View key={m.codigo} className="gap-2 rounded-xl border border-border p-3.5">
                    <Text className="text-sm font-semibold">
                      {m.codigo} · {m.algoritmo}
                    </Text>
                    <Text className="text-xs text-muted-foreground">{m.autorBib}</Text>
                    <Text className="rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs">{m.metricasTexto}</Text>
                    <View className="flex-row gap-1.5">
                      <Icon as={LineChart} size={14} className="mt-0.5 text-muted-foreground" />
                      <Text className="flex-1 text-xs text-muted-foreground">KPI: {m.kpiAsociado}</Text>
                    </View>
                    <View className="flex-row gap-1.5">
                      <Icon as={BookOpen} size={14} className="mt-0.5 text-muted-foreground" />
                      <Text className="flex-1 font-mono text-xs text-muted-foreground">{m.formulaResumen}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
