import { Camera } from 'phosphor-react-native';
import { Linking, View } from 'react-native';
import { EstadoVacio } from '@/components/common/EstadoVacio';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

interface Props {
  puedePreguntar: boolean;
  onPedir: () => void;
  onEscribir: () => void;
}

/** Permiso de cámara explicado antes de pedirlo; si se negó para siempre, lleva a Ajustes. */
export function PermisoCamara({ puedePreguntar, onPedir, onEscribir }: Props) {
  return (
    <View className="flex-1 justify-center pb-10">
      <EstadoVacio
        icono={Camera}
        titulo="Permitir la cámara"
        texto="La usamos solo para leer el código de la etiqueta de la prenda. No sacamos fotos ni guardamos nada. También podés escribir el código a mano."
      >
        <Button onPress={puedePreguntar ? onPedir : () => void Linking.openSettings()}>
          <Text>{puedePreguntar ? 'Permitir cámara' : 'Abrir ajustes'}</Text>
        </Button>
        <Button variant="outline" onPress={onEscribir}>
          <Text>Escribir el código</Text>
        </Button>
      </EstadoVacio>
    </View>
  );
}
