import React from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { esAbierta, ETIQUETA_ESTADO, pendientes } from '../lib/ordenes';
import { nombreVariante } from '../lib/stock';
import type { EstadoOrdenCompra, OrdenCompra, VarianteConProducto } from '../types/inventario.types';

const COLOR: Record<EstadoOrdenCompra, string> = {
  PENDIENTE: 'bg-amber-500/10 text-amber-700',
  RECIBIDA_PARCIAL: 'bg-indigo-500/10 text-indigo-700',
  RECIBIDA: 'bg-emerald-500/10 text-emerald-700',
  CANCELADA: 'bg-rose-500/10 text-rose-600',
  EN_TRANSITO: 'bg-sky-500/10 text-sky-700',
};

const dia = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' }) : null);

interface Props {
  orden: OrdenCompra;
  proveedor?: string;
  sucursal?: string;
  variantes: VarianteConProducto[];
  onRecibir: () => void;
  onCancelar: () => void;
}

/** Orden de compra a un proveedor con sus prendas y, si sigue abierta, recibir o cancelar. */
export function OrdenCard({ orden: o, proveedor, sucursal, variantes, onRecibir, onCancelar }: Props) {
  const porId = new Map(variantes.map((v) => [v.varianteId, v]));
  const abierta = esAbierta(o);
  return (
    <View className="gap-2 rounded-2xl border border-border bg-card p-3">
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <Text className="text-sm font-semibold" numberOfLines={1}>{proveedor ?? 'Proveedor'}</Text>
          <Text className="text-xs text-muted-foreground">
            #{o.id.slice(0, 8)} · a {sucursal ?? 'sucursal'} · pedida {dia(o.fechaPedido)}
            {o.fechaEsperada ? ` · llega ${dia(o.fechaEsperada)}` : ''}
          </Text>
        </View>
        <Text className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', COLOR[o.estado])}>{ETIQUETA_ESTADO[o.estado] ?? o.estado}</Text>
      </View>
      {o.items.map((i) => (
        <Text key={i.varianteId} className="text-xs" numberOfLines={1}>
          {i.cantidadRecibida}/{i.cantidadPedida} u. · {nombreVariante(porId.get(i.varianteId), i.varianteId)}
        </Text>
      ))}
      {abierta ? (
        <View className="flex-row items-center gap-2 pt-1">
          <Text className="flex-1 text-xs text-muted-foreground">Faltan {pendientes(o)} u.</Text>
          <Button size="sm" variant="ghost" onPress={onCancelar}><Text className="text-destructive">Cancelar</Text></Button>
          <Button size="sm" onPress={onRecibir}><Text>Recibir</Text></Button>
        </View>
      ) : null}
    </View>
  );
}
