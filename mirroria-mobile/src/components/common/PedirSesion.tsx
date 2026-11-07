import { router } from 'expo-router';
import { LockKey } from 'phosphor-react-native';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Titulo } from './Titulo';

interface Props {
  visible: boolean;
  onCerrar: () => void;
  /** Qué quería hacer la visitante: "agregar al carrito", "reservar"… */
  motivo: string;
  nombreTienda: string;
}

/** Hoja inferior para la visitante: toda acción que necesita cuenta pasa por acá. */
export function PedirSesion({ visible, onCerrar, motivo, nombreTienda }: Props) {
  const insets = useSafeAreaInsets();
  const ir = (ruta: '/acceso/login' | '/acceso/registro') => {
    onCerrar();
    router.push(ruta);
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar} statusBarTranslucent>
      <Pressable className="flex-1 bg-black/40" onPress={onCerrar} accessibilityLabel="Cerrar" />
      <View className="rounded-t-3xl bg-card px-6 pt-3" style={{ paddingBottom: insets.bottom + 20 }}>
        <View className="mb-5 h-1 w-10 self-center rounded-full bg-border" />
        <View className="mb-4 h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Icon as={LockKey} size={24} weight="duotone" className="text-primary" />
        </View>
        <Titulo nivel="h2">Iniciá sesión para {motivo}</Titulo>
        <Text className="mt-2 text-sm leading-5 text-muted-foreground">
          Usá tu cuenta de {nombreTienda}. Podés seguir mirando la vitrina sin cuenta.
        </Text>
        <View className="mt-6 gap-2">
          <Button size="lg" onPress={() => ir('/acceso/login')}>
            <Text>Iniciar sesión</Text>
          </Button>
          <Button size="lg" variant="outline" onPress={() => ir('/acceso/registro')}>
            <Text>Crear cuenta</Text>
          </Button>
          <Button variant="ghost" onPress={onCerrar}>
            <Text>Ahora no</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
}
