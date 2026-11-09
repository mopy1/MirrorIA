import { CameraView } from 'expo-camera';
import { Flashlight } from 'phosphor-react-native';
import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface Props {
  activo: boolean;
  pausado: boolean;
  onLeer: (texto: string) => void;
}

const ESQUINA = 'absolute h-10 w-10 border-white';

/** Cámara trasera que lee QR y Code128, con marco de encuadre y linterna (para probadores con poca luz). */
export function VisorEtiqueta({ activo, pausado, onLeer }: Props) {
  const [linterna, setLinterna] = React.useState(false);
  // La vista previa nativa no se re-escala si el visor cambia de alto (p. ej. al abrir "Escribir código"):
  // se remonta con el alto como key para que vuelva a llenar el marco.
  const [alto, setAlto] = React.useState(0);
  return (
    <View className="mx-5 flex-1 overflow-hidden rounded-xl bg-black" onLayout={(e) => setAlto(Math.round(e.nativeEvent.layout.height))}>
      {activo && alto > 0 ? (
        <CameraView
          key={alto}
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={linterna}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128'] }}
          onBarcodeScanned={pausado ? undefined : (r) => onLeer(r.data)}
        />
      ) : null}
      <View pointerEvents="none" className="flex-1 items-center justify-center">
        <View className="h-60 w-60">
          <View className={cn(ESQUINA, 'left-0 top-0 rounded-tl-lg border-l-4 border-t-4')} />
          <View className={cn(ESQUINA, 'right-0 top-0 rounded-tr-lg border-r-4 border-t-4')} />
          <View className={cn(ESQUINA, 'bottom-0 left-0 rounded-bl-lg border-b-4 border-l-4')} />
          <View className={cn(ESQUINA, 'bottom-0 right-0 rounded-br-lg border-b-4 border-r-4')} />
        </View>
        <View className="mt-5 rounded-full bg-black/50 px-4 py-2">
          <Text className="font-body-medium text-xs text-white">Encuadrá el código de la etiqueta</Text>
        </View>
      </View>
      <Pressable
        onPress={() => setLinterna((v) => !v)}
        accessibilityRole="switch"
        accessibilityState={{ checked: linterna }}
        accessibilityLabel="Linterna"
        className={cn('absolute right-3 top-3 h-11 w-11 items-center justify-center rounded-full', linterna ? 'bg-white' : 'bg-black/45')}
      >
        <Icon as={Flashlight} size={20} weight={linterna ? 'fill' : 'regular'} className={linterna ? 'text-black' : 'text-white'} />
      </Pressable>
    </View>
  );
}
