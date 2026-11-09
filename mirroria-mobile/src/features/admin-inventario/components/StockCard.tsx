import React from 'react';
import { Image, View } from 'react-native';
import { SlidersHorizontal, Truck } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { FilaStock, NivelStock } from '../lib/stock';

const ESTILO: Record<NivelStock, { caja: string; texto: string; etiqueta: (n: number) => string }> = {
  agotado: { caja: 'border-destructive/30 bg-destructive/10', texto: 'text-destructive', etiqueta: () => '0 u. · Agotado' },
  bajo: { caja: 'border-amber-500/30 bg-amber-500/10', texto: 'text-amber-700', etiqueta: (n) => `${n} u. · Bajo` },
  ok: { caja: 'border-emerald-500/30 bg-emerald-500/10', texto: 'text-emerald-700', etiqueta: (n) => `${n} u.` },
};

export function StockBadge({ nivel, cantidad }: { nivel: NivelStock; cantidad: number }) {
  const e = ESTILO[nivel];
  return (
    <View className={cn('rounded-full border px-2.5 py-0.5', e.caja)}>
      <Text className={cn('text-xs font-semibold', e.texto)}>{e.etiqueta(cantidad)}</Text>
    </View>
  );
}

interface Props {
  fila: FilaStock;
  onAjustar: () => void;
  /** Solo la dueña: pedir reposición al proveedor. */
  onPedir?: () => void;
}

/** Una variante en la sucursal: disponible, reservado, en camino y acciones. */
export function StockCard({ fila: f, onAjustar, onPedir }: Props) {
  const v = f.variante;
  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-3">
      <View className="flex-row items-center gap-3">
        {v?.imagenUrl ? (
          <Image source={{ uri: v.imagenUrl }} className="h-12 w-12 rounded-xl bg-muted" resizeMode="cover" />
        ) : (
          <View className="h-12 w-12 rounded-xl bg-muted" />
        )}
        <View className="flex-1">
          <Text className="text-sm font-semibold" numberOfLines={1}>{v?.productoTitulo ?? 'Prenda sin datos'}</Text>
          <Text className="text-xs text-muted-foreground">
            {v ? `Talla ${v.tallaNombre} · ${v.colorNombre}` : f.varianteId.slice(0, 8)}
          </Text>
        </View>
        <StockBadge nivel={f.nivel} cantidad={f.cantidadDisponible} />
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="flex-1 text-xs text-muted-foreground">
          {f.cantidadReservada} reservadas · {f.cantidadEnTransito} en camino
        </Text>
        {onPedir ? (
          <Button size="sm" variant={f.nivel === 'ok' ? 'ghost' : 'outline'} onPress={onPedir} accessibilityLabel="Pedir al proveedor">
            <Icon as={Truck} size={16} className="text-foreground" />
            <Text>Pedir</Text>
          </Button>
        ) : null}
        <Button size="sm" variant="outline" onPress={onAjustar}>
          <Icon as={SlidersHorizontal} size={16} className="text-foreground" />
          <Text>Ajustar</Text>
        </Button>
      </View>
    </View>
  );
}
