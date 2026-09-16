import React from 'react';
import { View } from 'react-native';
import { Rotate3d, Maximize2, Sparkles, Shirt } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

interface FittingStagePreviewProps {
  garmentTitle: string;
  garmentPriceFormatted: string;
  hasModel3D: boolean;
}

export function FittingStagePreview({
  garmentTitle,
  garmentPriceFormatted,
  hasModel3D,
}: FittingStagePreviewProps) {
  return (
    <View
      style={{ minHeight: 310 }}
      className="rounded-3xl bg-card border border-border/80 p-5 shadow-sm overflow-hidden relative justify-between"
    >
      {/* Top Bar de herramientas del visor */}
      <View className="flex-row items-center justify-between z-10">
        <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/80 border border-border/60">
          <Icon as={Rotate3d} size={13} className="text-primary" />
          <Text className="text-[10px] font-semibold text-foreground">
            360° Táctil
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/80 border border-border/60">
          <Icon as={Maximize2} size={13} className="text-muted-foreground" />
          <Text className="text-[10px] font-medium text-muted-foreground">
            Zoom
          </Text>
        </View>
      </View>

      {/* Centro: Maniquí / Avatar boutique perfectamente concéntrico y centrado */}
      <View className="items-center justify-center my-3 z-10">
        <View className="w-36 h-36 rounded-full bg-primary/10 items-center justify-center mb-3">
          <View className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center border-2 border-dashed border-primary/40">
            <Icon as={Shirt} size={46} className="text-primary" />
          </View>
        </View>

        <View className="items-center px-4">
          <Text className="text-sm font-bold text-center text-foreground">
            {garmentTitle}
          </Text>
          <Text className="text-xs font-semibold text-primary mt-1">
            {garmentPriceFormatted}
          </Text>
        </View>
      </View>

      {/* Aviso de motor 3D */}
      <View className="z-10 p-2.5 rounded-xl bg-muted/60 border border-border/50 flex-row items-center gap-2">
        <Icon as={Sparkles} size={14} className="text-primary shrink-0" />
        <Text className="text-[10px] text-muted-foreground flex-1 leading-tight">
          {hasModel3D
            ? 'Modelo 3D (.glb) vinculado con Three.js & Realidad Aumentada listo para renderizar.'
            : 'Prenda en fase de digitalización 3D por el equipo de diseño.'}
        </Text>
      </View>
    </View>
  );
}
