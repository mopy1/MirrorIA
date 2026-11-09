import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { ChevronRight, Shirt } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatMoney } from '@/src/lib/money';
import type { Producto } from '../types/catalogo-admin.types';

interface Props {
  producto: Producto;
  categoria?: string;
  coleccion?: string;
  onAbrir: () => void;
  /** Solo en prendas desactivadas: botón para volver a activarla. */
  onReactivar?: () => void;
  reactivando?: boolean;
}

/** Tarjeta de una prenda en el listado del panel. */
export function ProductoCard({ producto: p, categoria, coleccion, onAbrir, onReactivar, reactivando }: Props) {
  const foto = [...(p.imagenes ?? [])].sort((a, b) => a.orden - b.orden)[0]?.url;
  return (
    <Pressable onPress={onAbrir} className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3 active:bg-muted">
      {foto ? (
        <Image source={{ uri: foto }} className={`h-16 w-16 rounded-xl bg-muted ${p.activo ? '' : 'opacity-50'}`} resizeMode="cover" />
      ) : (
        <View className="h-16 w-16 items-center justify-center rounded-xl bg-muted">
          <Icon as={Shirt} size={22} className="text-muted-foreground" />
        </View>
      )}
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-semibold" numberOfLines={1}>{p.titulo}</Text>
        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
          {[categoria, coleccion].filter(Boolean).join(' · ')}
        </Text>
        <Text className="text-sm font-bold text-primary">{formatMoney(p.precioCents)}</Text>
      </View>
      {onReactivar ? (
        <Button size="sm" variant="outline" disabled={reactivando} onPress={onReactivar}>
          <Text>{reactivando ? '…' : 'Reactivar'}</Text>
        </Button>
      ) : (
        <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
      )}
    </Pressable>
  );
}
