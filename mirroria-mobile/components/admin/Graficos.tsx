import React from 'react';
import { View } from 'react-native';
import Svg, { Line, Polyline, Rect } from 'react-native-svg';
import { Text } from '@/components/ui/text';

const COLOR = 'hsl(348, 65%, 26%)';
const ANCHO = 320;

export interface Punto {
  etiqueta: string;
  valor: number;
}

/** Barras horizontales con su etiqueta y cifra (top prendas, pasarelas…). */
export function BarrasHorizontales({ datos, formato = String }: { datos: Punto[]; formato?: (n: number) => string }) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <View className="gap-2">
      {datos.map((d, i) => (
        <View key={`${d.etiqueta}-${i}`} className="gap-1">
          <View className="flex-row justify-between">
            <Text numberOfLines={1} className="text-xs flex-1 pr-2">
              {d.etiqueta}
            </Text>
            <Text className="text-xs font-medium">{formato(d.valor)}</Text>
          </View>
          <View className="h-2 rounded-full bg-muted overflow-hidden">
            <View className="h-2 rounded-full bg-primary" style={{ width: `${(d.valor / max) * 100}%` }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Línea de tendencia simple (ventas por día). */
export function LineaTendencia({ datos, alto = 140 }: { datos: Punto[]; alto?: number }) {
  if (datos.length === 0) return null;
  const max = Math.max(1, ...datos.map((d) => d.valor));
  const paso = datos.length > 1 ? ANCHO / (datos.length - 1) : 0;
  const puntos = datos.map((d, i) => `${i * paso},${alto - (d.valor / max) * (alto - 8) - 4}`).join(' ');
  return (
    <View className="gap-1">
      <Svg width="100%" height={alto} viewBox={`0 0 ${ANCHO} ${alto}`} preserveAspectRatio="none">
        <Line x1={0} y1={alto - 1} x2={ANCHO} y2={alto - 1} stroke="#e5e5e5" strokeWidth={1} />
        <Polyline points={puntos} fill="none" stroke={COLOR} strokeWidth={2.5} />
      </Svg>
      <View className="flex-row justify-between">
        <Text className="text-[10px] text-muted-foreground">{datos[0].etiqueta}</Text>
        <Text className="text-[10px] text-muted-foreground">{datos[datos.length - 1].etiqueta}</Text>
      </View>
    </View>
  );
}

/** Columnas verticales (comparar pocas categorías). */
export function Columnas({ datos, alto = 140 }: { datos: Punto[]; alto?: number }) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  const w = ANCHO / Math.max(1, datos.length);
  return (
    <View className="gap-1">
      <Svg width="100%" height={alto} viewBox={`0 0 ${ANCHO} ${alto}`} preserveAspectRatio="none">
        {datos.map((d, i) => {
          const h = (d.valor / max) * (alto - 4);
          return (
            <Rect key={`${d.etiqueta}-${i}`} x={i * w + w * 0.15} y={alto - h} width={w * 0.7} height={h} rx={3} fill={COLOR} />
          );
        })}
      </Svg>
      <View className="flex-row">
        {datos.map((d, i) => (
          <Text key={`${d.etiqueta}-${i}`} numberOfLines={1} className="flex-1 text-center text-[10px] text-muted-foreground">
            {d.etiqueta}
          </Text>
        ))}
      </View>
    </View>
  );
}
