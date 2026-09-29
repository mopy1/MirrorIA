import React from 'react';
import { View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import type { EstadoIA } from '../hooks/useProbadorIA';

const ETIQUETA: Record<EstadoIA, string> = {
  inactivo: 'En espera',
  conectando: 'Conectando',
  conectado: 'IA en vivo',
  error: 'Sin conexión',
};

export function ProbadorHeader({ estado }: { estado: EstadoIA }) {
  return (
    <View className="px-5 py-3 border-b border-border/40 bg-card/60">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Icon as={Sparkles} size={20} className="text-primary" />
          <Text className="text-lg font-bold text-foreground">Probador IA</Text>
        </View>

        <Badge variant="outline" className="border-primary/30 bg-primary/10">
          <Text className="text-[10px] font-bold text-primary">{ETIQUETA[estado]}</Text>
        </Badge>
      </View>

      <Text className="text-xs text-muted-foreground mt-1">
        Elegí una prenda y mirate con ella puesta, en vivo
      </Text>
    </View>
  );
}
