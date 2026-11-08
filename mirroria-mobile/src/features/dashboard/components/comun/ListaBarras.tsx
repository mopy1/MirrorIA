import React from 'react';
import { Image, View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { FilaBarra } from '../../lib/graficos';

/** Ranking: nombre, detalle, cifra y barra proporcional (con miniatura opcional). */
export function ListaBarras({ filas, conImagen }: { filas: FilaBarra[]; conImagen?: boolean }) {
  return (
    <View className="gap-3.5">
      {filas.map((f) => (
        <View key={f.id} className="flex-row items-center gap-3">
          {conImagen ? (
            f.imagenUrl ? (
              <Image source={{ uri: f.imagenUrl }} className="h-11 w-11 rounded-lg bg-muted" />
            ) : (
              <View className="h-11 w-11 rounded-lg bg-muted" />
            )
          ) : null}
          <View className="flex-1 gap-1">
            <View className="flex-row items-baseline justify-between gap-2">
              <Text numberOfLines={1} className="flex-1 text-sm font-medium">
                {f.nombre}
              </Text>
              <Text className="text-sm font-semibold">{f.valor}</Text>
            </View>
            <Text className="text-xs text-muted-foreground">{f.detalle}</Text>
            <View className="h-1.5 overflow-hidden rounded-full bg-muted">
              <View className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.max(2, f.proporcion * 100)}%` }} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
