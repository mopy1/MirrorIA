import React from 'react';
import { Pressable, View } from 'react-native';
import { Maximize2, Minimize2, SwitchCamera } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

interface CameraControlsProps {
  onFlip: () => void;
  onToggleExpand: () => void;
  isExpanded: boolean;
  topOffset: number;
}

/** Botones flotantes sobre la cámara, comunes al modo tarjeta y pantalla completa. */
export function CameraControls({
  onFlip,
  onToggleExpand,
  isExpanded,
  topOffset,
}: CameraControlsProps) {
  return (
    <View
      style={{ top: topOffset }}
      className="absolute right-3 flex-row items-center gap-2"
    >
      <Pressable
        onPress={onToggleExpand}
        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50"
      >
        <Icon as={isExpanded ? Minimize2 : Maximize2} size={14} className="text-white" />
        <Text className="text-[10px] font-semibold text-white">
          {isExpanded ? 'Achicar' : 'Agrandar'}
        </Text>
      </Pressable>

      <Pressable
        onPress={onFlip}
        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50"
      >
        <Icon as={SwitchCamera} size={14} className="text-white" />
        <Text className="text-[10px] font-semibold text-white">Cambiar</Text>
      </Pressable>
    </View>
  );
}
