import React from 'react';
import { Pressable, View } from 'react-native';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { etiquetaFila, formatearPorcentaje, formatearValor } from '../lib/formato';
import { calcularTotales, type ColumnaOrden, type DireccionOrden } from '../lib/tabla';
import type { FilaReporte, Variacion } from '../types/reports.types';

export interface Columnas {
  etiqueta: string;
  valor: string;
  comparacion: boolean;
}

/** Anchos: sin comparación la tabla ocupa el ancho del teléfono; con comparación son fijos y se desliza. */
const ANCHO = { etiqueta: 'flex-[1.4]', numero: 'flex-1' };

function claseCambio(delta: number | null | undefined): string {
  if (delta == null || delta === 0) return 'text-muted-foreground';
  return delta > 0 ? 'text-emerald-700' : 'text-destructive';
}

function Celda({ children, derecha, className }: { children: React.ReactNode; derecha?: boolean; className?: string }) {
  return (
    <View className={cn('px-3 py-2.5 justify-center', derecha ? `${ANCHO.numero} items-end` : ANCHO.etiqueta, className)}>
      {children}
    </View>
  );
}

function Titulo({ col, texto, derecha, orden, onOrdenar }: {
  col: ColumnaOrden;
  texto: string;
  derecha?: boolean;
  orden: { columna: ColumnaOrden; direccion: DireccionOrden };
  onOrdenar: (c: ColumnaOrden) => void;
}) {
  const activa = orden.columna === col;
  const Flecha = !activa ? ArrowUpDown : orden.direccion === 'asc' ? ArrowUp : ArrowDown;
  return (
    <Pressable
      onPress={() => onOrdenar(col)}
      accessibilityRole="button"
      accessibilityLabel={`Ordenar por ${texto}`}
      accessibilityState={{ selected: activa }}
      className={cn('min-h-11 flex-row items-center gap-1 px-3 py-2', derecha ? `${ANCHO.numero} justify-end` : ANCHO.etiqueta)}
    >
      <Text className={cn('text-xs font-semibold', activa ? 'text-foreground' : 'text-muted-foreground')} numberOfLines={2}>{texto}</Text>
      <Icon as={Flecha} size={12} className={activa ? 'text-primary' : 'text-muted-foreground'} />
    </Pressable>
  );
}

export function CabeceraTabla({ columnas, orden, onOrdenar }: {
  columnas: Columnas;
  orden: { columna: ColumnaOrden; direccion: DireccionOrden };
  onOrdenar: (c: ColumnaOrden) => void;
}) {
  const p = { orden, onOrdenar };
  return (
    <View className="flex-row border-b border-border bg-muted/50">
      <Titulo col="etiqueta" texto={columnas.etiqueta} {...p} />
      <Titulo col="valor" texto={columnas.valor} derecha {...p} />
      {columnas.comparacion ? <Titulo col="anterior" texto="Período anterior" derecha {...p} /> : null}
      {columnas.comparacion ? <Titulo col="variacion" texto="Cambio" derecha {...p} /> : null}
    </View>
  );
}

export function FilaTabla({ fila, par, metrica, dimension, columnas, variacion }: {
  fila: FilaReporte;
  par: boolean;
  metrica: string;
  dimension: string | null;
  columnas: Columnas;
  variacion?: Variacion;
}) {
  return (
    <View className={cn('flex-row border-b border-border/60', !par && 'bg-muted/20')}>
      <Celda><Text className="text-sm">{etiquetaFila(fila.etiqueta, dimension)}</Text></Celda>
      <Celda derecha><Text className="text-sm font-medium">{formatearValor(fila.valor, metrica)}</Text></Celda>
      {columnas.comparacion ? (
        <Celda derecha>
          <Text className="text-sm text-muted-foreground">{variacion ? formatearValor(variacion.anterior, metrica) : 'Sin datos'}</Text>
        </Celda>
      ) : null}
      {columnas.comparacion ? (
        <Celda derecha>
          <Text className={cn('text-sm', claseCambio(variacion?.deltaPorcentual))}>
            {variacion?.deltaPorcentual == null ? 'Sin datos antes' : formatearPorcentaje(variacion.deltaPorcentual, true)}
          </Text>
        </Celda>
      ) : null}
    </View>
  );
}

export function FilaTotales({ filas, metrica, variaciones, columnas }: {
  filas: FilaReporte[];
  metrica: string;
  variaciones?: Variacion[];
  columnas: Columnas;
}) {
  const t = calcularTotales(filas, variaciones);
  return (
    <View className="flex-row bg-muted/50">
      <Celda><Text className="text-sm font-bold">Total</Text></Celda>
      <Celda derecha><Text className="text-sm font-bold">{formatearValor(t.total, metrica)}</Text></Celda>
      {columnas.comparacion ? <Celda derecha><Text className="text-sm text-muted-foreground">{formatearValor(t.anterior, metrica)}</Text></Celda> : null}
      {columnas.comparacion ? (
        <Celda derecha>
          <Text className={cn('text-sm font-medium', claseCambio(t.delta))}>{t.delta === null ? 'Sin datos antes' : formatearPorcentaje(t.delta, true)}</Text>
        </Celda>
      ) : null}
    </View>
  );
}
