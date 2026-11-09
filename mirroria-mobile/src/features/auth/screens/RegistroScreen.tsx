import { router } from 'expo-router';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { Pantalla } from '@/components/common/Pantalla';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTienda } from '@/contexts/TiendaContext';
import { CabeceraAcceso } from '../components/CabeceraAcceso';
import { FormRegistro } from '../components/FormRegistro';

/** `/acceso/registro`: alta de clienta en la tienda elegida. */
export default function RegistroScreen() {
  const { tienda } = useTienda();
  return (
    <Pantalla>
      <EncabezadoPantalla respaldo="/vitrina" />
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-10">
          <CabeceraAcceso titulo="Creá tu cuenta" subtitulo={`Para comprar y reservar en ${tienda?.nombre ?? 'la tienda'}`} />
          <View className="px-6 pt-6">
            <FormRegistro />
            <View className="mt-6 flex-row items-center justify-center">
              <Text className="text-sm text-muted-foreground">¿Ya tenés cuenta?</Text>
              <Button variant="link" onPress={() => router.replace('/acceso/login')}>
                <Text className="text-primary">Iniciar sesión</Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}
