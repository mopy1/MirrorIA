import React from 'react';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { marcaParaApp } from '../lib/marca-tienda';
import type { TiendaPublica } from '../types/saas.types';
import { LogoTienda } from './LogoTienda';

interface Props {
  tienda: TiendaPublica;
  actual: boolean;
  entrando: boolean;
  onPress: () => void;
}

/** Una tienda del directorio: logo, nombre, eslogan y si está abierta. */
export function TiendaFila({ tienda, actual, entrando, onPress }: Props) {
  const m = marcaParaApp(tienda, Platform.OS === 'web');
  return (
    <Pressable
      onPress={onPress}
      disabled={entrando}
      className={cn('flex-row items-center gap-3 rounded-2xl border bg-card p-3.5 active:bg-muted/40', actual ? 'border-primary' : 'border-border')}
    >
      <LogoTienda nombre={m.nombre} logoUrl={m.logoUrl} color={m.colorPrimario} tamano={44} />
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text numberOfLines={1} className="shrink text-base font-semibold text-foreground">{m.nombre}</Text>
          {actual && <Text className="text-[11px] font-semibold text-primary">Estás acá</Text>}
        </View>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">{m.eslogan ?? `/t/${m.slug}`}</Text>
        {!m.disponible && <Text className="text-[11px] font-medium text-amber-700">No disponible por el momento</Text>}
      </View>
      {entrando ? <ActivityIndicator size="small" /> : <Icon as={ChevronRight} size={18} className="text-muted-foreground" />}
    </Pressable>
  );
}
