import { router } from 'expo-router';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { Pantalla } from '@/components/common/Pantalla';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTienda } from '@/contexts/TiendaContext';
import { CabeceraAcceso } from '../components/CabeceraAcceso';
import { FormLogin } from '../components/FormLogin';

/** `/acceso/login`: iniciar sesión en la tienda elegida (solo clientas). */
export default function LoginScreen() {
  const { tienda } = useTienda();
  return (
    <Pantalla>
      <EncabezadoPantalla respaldo="/vitrina" />
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-10">
          <CabeceraAcceso titulo="Hola de nuevo" subtitulo={`Entrá a tu cuenta de ${tienda?.nombre ?? 'la tienda'}`} />
          <View className="px-6 pt-6">
            <FormLogin />
            <View className="mt-6 flex-row items-center justify-center">
              <Text className="text-sm text-muted-foreground">¿Primera vez?</Text>
              <Button variant="link" onPress={() => router.replace('/acceso/registro')}>
                <Text className="text-primary">Crear cuenta</Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}
