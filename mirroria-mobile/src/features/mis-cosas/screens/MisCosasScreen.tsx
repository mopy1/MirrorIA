import { router } from 'expo-router';
import { ArrowsClockwise, Bell, CalendarCheck, Receipt, Storefront, UserCircle } from 'phosphor-react-native';
import { ScrollView, View } from 'react-native';
import { EstadoVacio } from '@/components/common/EstadoVacio';
import { Pantalla } from '@/components/common/Pantalla';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useSesion } from '@/contexts/SesionContext';
import { useTienda } from '@/contexts/TiendaContext';
import { CerrarSesion } from '../components/CerrarSesion';
import { FilaEnlace } from '../components/FilaEnlace';
import { PerfilClienta } from '../components/PerfilClienta';
import { TarjetaEspejo } from '../components/TarjetaEspejo';

/** Tab Mis cosas: dashboard de la clienta (R8). La visitante ve cómo entrar y puede cambiar de tienda. */
export default function MisCosasScreen() {
  const { sesion } = useSesion();
  const { tienda } = useTienda();
  const nombre = tienda?.nombre ?? 'la tienda';

  if (!sesion) {
    return (
      <Pantalla>
        <ScrollView contentContainerClassName="flex-grow justify-center pb-10">
          <EstadoVacio icono={UserCircle} titulo="Iniciá sesión" texto={`Con tu cuenta de ${nombre} ves tus pedidos, tus reservas y tu pase de tienda.`}>
            <Button onPress={() => router.push('/acceso/login')}>
              <Text>Iniciar sesión</Text>
            </Button>
            <Button variant="outline" onPress={() => router.push('/acceso/registro')}>
              <Text>Crear cuenta</Text>
            </Button>
          </EstadoVacio>
          <TarjetaEspejo />
          <FilaEnlace icono={ArrowsClockwise} titulo="Pendientes de enviar" detalle="Estado de la conexión y modo demo sin red" onPress={() => router.push('/mis-cosas/pendientes')} />
          <FilaEnlace icono={Storefront} titulo="Cambiar de tienda" detalle={`Estás en ${nombre}`} onPress={() => router.push('/tiendas')} />
        </ScrollView>
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <ScrollView contentContainerClassName="pb-10">
        <PerfilClienta usuario={sesion.usuario} tienda={nombre} />
        <TarjetaEspejo />
        <View>
          <FilaEnlace icono={Receipt} titulo="Mis pedidos" detalle="Compras y pagos pendientes" onPress={() => router.push('/mis-cosas/pedidos')} />
          <FilaEnlace icono={CalendarCheck} titulo="Mis reservas" detalle="Tu pase de tienda para probarte" onPress={() => router.push('/mis-cosas/reservas')} />
          <FilaEnlace icono={ArrowsClockwise} titulo="Pendientes de enviar" detalle="Lo guardado sin red y el modo demo" onPress={() => router.push('/mis-cosas/pendientes')} />
          <FilaEnlace icono={Bell} titulo="Avisos" detalle="Cuando vuelva tu talla" onPress={() => router.push('/mis-cosas/avisos')} />
          <FilaEnlace icono={Storefront} titulo="Cambiar de tienda" detalle={`Estás en ${nombre}`} onPress={() => router.push('/tiendas')} />
          <CerrarSesion tienda={nombre} />
        </View>
      </ScrollView>
    </Pantalla>
  );
}
