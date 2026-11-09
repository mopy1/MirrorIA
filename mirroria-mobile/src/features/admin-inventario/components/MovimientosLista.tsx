import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { etiquetaMovimiento, nombreVariante } from '../lib/stock';
import type { MovimientoInventario, VarianteConProducto } from '../types/inventario.types';

const fecha = (iso: string) =>
  new Date(iso).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Historial de movimientos de stock (ventas, reservas, recepciones y ajustes), el más nuevo arriba. */
export function MovimientosLista({ movimientos, variantes }: { movimientos: MovimientoInventario[]; variantes: VarianteConProducto[] }) {
  const porId = new Map(variantes.map((v) => [v.varianteId, v]));
  return (
    <View className="gap-2">
      {movimientos.map((m) => {
        const sube = m.cantidad > 0;
        return (
          <View key={m.id} className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <View className={cn('h-11 w-14 items-center justify-center rounded-xl', sube ? 'bg-emerald-500/10' : 'bg-destructive/10')}>
              <Text className={cn('text-base font-bold', sube ? 'text-emerald-700' : 'text-destructive')}>
                {sube ? '+' : ''}{m.cantidad}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium" numberOfLines={1}>{nombreVariante(porId.get(m.varianteId), m.varianteId)}</Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={2}>
                {etiquetaMovimiento(m.tipoMovimiento)}{m.motivo ? ` · ${m.motivo}` : ''} · {fecha(m.fecha)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
