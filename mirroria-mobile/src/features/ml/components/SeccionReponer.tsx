import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { EtiquetaTono } from '@/src/features/dashboard/components/comun/EtiquetaTono';
import { ordenarPorUrgencia, seAgota, textoDuracion, textoReposicion } from '../lib/ml-demanda';
import { contar, estadoStock } from '../lib/ml-lenguaje';
import { formatearNombrePrenda } from '../lib/ml.utils';
import type { DemandaMlResponse, ItemPrediccionDemanda } from '../types/ml.types';
import { BloqueMl } from './BloqueMl';

const PASO = 8;

function Barra({ valor, escala, clase }: { valor: number; escala: number; clase: string }) {
  const ancho = escala > 0 ? Math.max(valor > 0 ? 2 : 0, (valor / escala) * 100) : 0;
  return (
    <View className="h-1.5 overflow-hidden rounded-full bg-muted">
      <View className={`h-1.5 rounded-full ${clase}`} style={{ width: `${ancho}%` }} />
    </View>
  );
}

function Fila({ item, nombre, dias, escala }: { item: ItemPrediccionDemanda; nombre: string; dias: number; escala: number }) {
  const estado = estadoStock(item.riesgo_quiebre);
  return (
    <View className="gap-2 border-t border-border/70 pt-3">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-sm font-medium">{nombre}</Text>
        <EtiquetaTono tono={estado.tono}>{estado.etiqueta}</EtiquetaTono>
      </View>
      <View className="gap-0.5">
        <Barra valor={item.stock_actual} escala={escala} clase="bg-muted-foreground/45" />
        <Barra valor={item.demanda_proyectada_unidades} escala={escala} clase="bg-primary" />
      </View>
      <Text className="text-sm text-muted-foreground">
        {textoReposicion(item, dias)} · <Text className="text-sm">{textoDuracion(item, dias)}</Text>
      </Text>
    </View>
  );
}

interface Props {
  data: DemandaMlResponse | null;
  nombres: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  onReintentar: () => void;
  limite?: number;
  onVerTodo?: () => void;
}

/** "Qué reponer": tenés vs. vas a vender por prenda, lo más urgente primero. */
export function SeccionReponer({ data, nombres, isLoading, error, onReintentar, limite, onVerTodo }: Props) {
  const router = useRouter();
  const [visibles, setVisibles] = useState(limite ?? PASO);
  const items = useMemo(() => ordenarPorUrgencia(data?.predicciones ?? []), [data]);
  const escala = Math.max(1, ...items.map((i) => Math.max(i.stock_actual, i.demanda_proyectada_unidades)));
  const dias = data?.horizonte_dias ?? 30;
  const enRiesgo = items.filter(seAgota).length;
  const frase = data
    ? enRiesgo > 0
      ? `${contar(enRiesgo, 'prenda se puede agotar', 'prendas se pueden agotar')} en los próximos ${dias} días si no reponés.`
      : `Con el stock actual llegás bien a los próximos ${dias} días.`
    : undefined;

  return (
    <BloqueMl
      titulo="Qué reponer"
      frase={frase}
      enlace={onVerTodo ? { texto: 'Ver todas', onPress: onVerTodo } : { texto: 'Ir a Inventario', onPress: () => router.push('/admin/inventario') }}
      isLoading={isLoading}
      error={error}
      hayDatos={!!data}
      que="qué conviene reponer"
      onReintentar={onReintentar}
      vacio={items.length === 0 ? { titulo: 'Todavía no hay prendas para proyectar', detalle: 'Cuando cargues prendas con stock en el catálogo, acá vas a ver cuáles conviene reponer y cuántas pedir.' } : null}>
      <View className="flex-row gap-4">
        <View className="flex-row items-center gap-1.5">
          <View className="h-1.5 w-4 rounded-full bg-muted-foreground/45" />
          <Text className="text-xs text-muted-foreground">Lo que tenés</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-1.5 w-4 rounded-full bg-primary" />
          <Text className="text-xs text-muted-foreground">Lo que vas a vender</Text>
        </View>
      </View>
      {items.slice(0, visibles).map((it) => (
        <Fila key={it.producto_id} item={it} dias={dias} escala={escala} nombre={formatearNombrePrenda(it.producto_id, nombres[it.producto_id] ?? it.nombre)} />
      ))}
      {!limite && items.length > visibles ? (
        <Button variant="ghost" onPress={() => setVisibles((v) => v + PASO)}>
          <Text>Mostrar {Math.min(PASO, items.length - visibles)} más de {items.length - visibles}</Text>
        </Button>
      ) : null}
    </BloqueMl>
  );
}
