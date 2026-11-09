import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { Categoria } from '../types/catalogo-admin.types';

interface Props {
  busqueda: string;
  onBuscar: (v: string) => void;
  categoria: string;
  onCategoria: (id: string) => void;
  categorias: Categoria[];
}

/** Buscador por nombre/slug y chips de categoría (lo mismo que la barra de la web). */
export function CatalogoFiltros({ busqueda, onBuscar, categoria, onCategoria, categorias }: Props) {
  const chips = [{ id: 'TODAS', nombre: 'Todas' }, ...categorias];
  return (
    <View className="gap-3">
      <View className="relative justify-center">
        <View className="absolute left-3 z-10">
          <Icon as={Search} size={16} className="text-muted-foreground" />
        </View>
        <Input value={busqueda} onChangeText={onBuscar} placeholder="Buscar por prenda o slug…" className="pl-9" autoCorrect={false} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {chips.map((c) => {
          const activo = c.id === categoria;
          return (
            <Pressable
              key={c.id}
              onPress={() => onCategoria(c.id)}
              className={cn('h-9 justify-center rounded-full border px-4', activo ? 'border-primary bg-primary' : 'border-border bg-background')}
            >
              <Text className={cn('text-sm', activo ? 'text-primary-foreground font-medium' : 'text-foreground')}>{c.nombre}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
