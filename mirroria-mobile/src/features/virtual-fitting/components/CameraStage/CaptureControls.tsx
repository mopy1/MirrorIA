import React from 'react';
import { Pressable, View } from 'react-native';
import { Camera as CameraIcon, Timer } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

interface CaptureControlsProps {
  timerSeconds: number;
  onCycleTimer: () => void;
  onCapture: () => void;
  isCapturing: boolean;
  bottomOffset: number;
}

/**
 * Barra inferior para autorretrato: ciclo de temporizador (0/3/5/10s) +
 * botón disparador. Pensada para probar sola/o frente a la cámara sin
 * necesitar que alguien más sostenga el teléfono.
 */
export function CaptureControls({
  timerSeconds,
  onCycleTimer,
  onCapture,
  isCapturing,
  bottomOffset,
}: CaptureControlsProps) {
  return (
    <View
      style={{ bottom: bottomOffset }}
      className="absolute left-0 right-0 items-center gap-3"
    >
      <Pressable
        onPress={onCycleTimer}
        disabled={isCapturing}
        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50"
      >
        <Icon as={Timer} size={14} className="text-white" />
        <Text className="text-[10px] font-semibold text-white">
          {timerSeconds === 0 ? 'Sin temporizador' : `${timerSeconds}s`}
        </Text>
      </Pressable>

      <Pressable
        onPress={onCapture}
        disabled={isCapturing}
        className="w-16 h-16 rounded-full bg-white/90 items-center justify-center border-4 border-white/40"
      >
        <Icon as={CameraIcon} size={26} className="text-black" />
      </Pressable>
    </View>
  );
}
