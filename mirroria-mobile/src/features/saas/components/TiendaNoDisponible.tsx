import React from 'react';
import { View } from 'react-native';
import { Store } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

interface Props {
  nombre: string;
  onOtrasTiendas: () => void;
  onSoyDuena: () => void;
}

/** Tienda suspendida o con la suscripción vencida (mismo texto que la web). */
export function TiendaNoDisponible({ nombre, onOtrasTiendas, onSoyDuena }: Props) {
  return (
    <View className="items-center gap-3 rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15">
        <Icon as={Store} size={28} className="text-amber-700" />
      </View>
      <Text className="text-xs font-semibold uppercase tracking-widest text-primary">{nombre}</Text>
      <Text className="text-center text-xl font-semibold text-foreground">
        Esta tienda no está disponible por el momento.
      </Text>
      <Text className="text-center text-sm text-muted-foreground">
        La tienda está en pausa. Volvé a intentar más tarde, o mirá otras tiendas creadas con MirrorIA.
      </Text>
      <View className="w-full gap-2.5 pt-2">
        <Button onPress={onOtrasTiendas}>
          <Text>Ver otras tiendas</Text>
        </Button>
        <Button variant="outline" onPress={onSoyDuena}>
          <Text>Soy la dueña: iniciar sesión</Text>
        </Button>
      </View>
    </View>
  );
}
