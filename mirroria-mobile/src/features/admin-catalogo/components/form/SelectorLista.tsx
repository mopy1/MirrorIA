import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Check, Search } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { normalizar } from '../../lib/texto';
import type { Opcion } from './SelectorChips';

interface Props {
  opciones: Opcion[];
  valor: string;
  onCambiar: (value: string) => void;
  placeholder?: string;
  vacio?: string;
  /** Cuántas filas mostrar a la vez (el resto aparece al buscar). */
  maximo?: number;
}

/** Elegir entre muchas opciones (variantes de prenda): buscador + lista corta de filas. */
export function SelectorLista({ opciones, valor, onCambiar, placeholder = 'Buscar…', vacio = 'Sin resultados', maximo = 6 }: Props) {
  const [q, setQ] = useState('');
  const elegida = opciones.find((o) => o.value === valor);
  const visibles = useMemo(() => {
    const n = normalizar(q);
    const filtradas = n ? opciones.filter((o) => normalizar(`${o.label} ${o.detalle ?? ''}`).includes(n)) : opciones;
    return filtradas.slice(0, maximo);
  }, [opciones, q, maximo]);

  return (
    <View className="gap-2">
      {elegida ? (
        <View className="rounded-xl border border-primary bg-primary/5 px-3 py-2">
          <Text className="text-sm font-medium">{elegida.label}</Text>
          {elegida.detalle ? <Text className="text-xs text-muted-foreground">{elegida.detalle}</Text> : null}
        </View>
      ) : null}
      <View className="relative justify-center">
        <View className="absolute left-3 z-10">
          <Icon as={Search} size={16} className="text-muted-foreground" />
        </View>
        <Input value={q} onChangeText={setQ} placeholder={placeholder} className="pl-9" autoCorrect={false} />
      </View>
      <View className="rounded-xl border border-border overflow-hidden">
        {visibles.length === 0 ? (
          <Text className="p-3 text-xs text-muted-foreground">{vacio}</Text>
        ) : (
          visibles.map((o, i) => (
            <Pressable
              key={o.value}
              onPress={() => onCambiar(o.value)}
              className={cn('flex-row items-center gap-2 px-3 py-2.5 active:bg-muted', i > 0 && 'border-t border-border')}
            >
              <View className="flex-1">
                <Text className="text-sm" numberOfLines={1}>{o.label}</Text>
                {o.detalle ? <Text className="text-xs text-muted-foreground" numberOfLines={1}>{o.detalle}</Text> : null}
              </View>
              {o.value === valor ? <Icon as={Check} size={18} className="text-primary" /> : null}
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}
