import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { ROLES, ROLES_LISTA, type FiltroRol } from '../lib/usuarios';

interface Props {
  busqueda: string;
  onBusqueda: (t: string) => void;
  rol: FiltroRol;
  onRol: (r: FiltroRol) => void;
}

/** Buscador por nombre/correo y chips de rol (el Select de la web). */
export function FiltroUsuarios({ busqueda, onBusqueda, rol, onRol }: Props) {
  const chips: { valor: FiltroRol; label: string }[] = [
    { valor: 'TODOS', label: 'Todos los roles' },
    ...ROLES_LISTA.map((r) => ({ valor: r, label: ROLES[r].label })),
  ];
  return (
    <View className="gap-3">
      <View className="justify-center">
        <Input value={busqueda} onChangeText={onBusqueda} placeholder="Buscar por nombre o correo..." className="pl-10" autoCapitalize="none" autoCorrect={false} />
        <View className="absolute left-3" pointerEvents="none">
          <Icon as={Search} size={16} className="text-muted-foreground" />
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {chips.map((c) => (
          <Pressable
            key={c.valor}
            onPress={() => onRol(c.valor)}
            className={cn('rounded-full border px-3.5 py-2', rol === c.valor ? 'border-primary bg-primary' : 'border-border bg-card')}
          >
            <Text className={cn('text-sm', rol === c.valor ? 'text-primary-foreground font-medium' : 'text-foreground')}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
