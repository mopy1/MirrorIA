import { router } from 'expo-router';
import { ArrowsClockwise, Bell, CalendarCheck, Receipt, Storefront, UserCircle } from 'phosphor-react-native';
import { RefreshControl, ScrollView, View } from 'react-native';
import { EstadoVacio } from '@/components/common/EstadoVacio';
import { Pantalla } from '@/components/common/Pantalla';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useSesion } from '@/contexts/SesionContext';
import { useTienda } from '@/contexts/TiendaContext';
import { CerrarSesion } from '../components/CerrarSesion';
import { FilaEnlace } from '../components/FilaEnlace';
import { KpisClienta } from '../components/KpisClienta';
import { PerfilClienta } from '../components/PerfilClienta';
import { ProximaCita } from '../components/ProximaCita';
import { TarjetaEspejo } from '../components/TarjetaEspejo';
import { useResumenClienta } from '../hooks/use-resumen-clienta';

/** Tab Mis cosas: dashboard de la clienta (R8). La visitante ve cómo entrar y puede cambiar de tienda. */
export default function MisCosasScreen() {
  const { sesion } = useSesion();
  const { tienda } = useTienda();
  const nombre = tienda?.nombre ?? 'la tienda';
  const k = useResumenClienta();
  const r = k.resumen;

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
      <ScrollView contentContainerClassName="gap-4 pb-10" refreshControl={<RefreshControl refreshing={k.refrescando} onRefresh={() => void k.refrescar()} />}>
        <PerfilClienta usuario={sesion.usuario} tienda={nombre} />
        <KpisClienta r={r} cupo={k.cupo} cargando={k.cargando} />
        {r.proxima ? <ProximaCita reserva={r.proxima} /> : null}
        {k.guardado ? <Text className="px-5 text-xs text-warning">Sin conexión: números de la última vez que hubo red.</Text> : null}
        <TarjetaEspejo />
        <View>
          <FilaEnlace icono={Receipt} titulo="Mis pedidos" detalle={r.porPagar > 0 ? `${r.porPagar} por pagar` : 'Compras y su estado de pago'} onPress={() => router.push('/mis-cosas/pedidos')} />
          <FilaEnlace icono={CalendarCheck} titulo="Mis reservas" detalle={r.reservasActivas > 0 ? `${r.reservasActivas} activa${r.reservasActivas > 1 ? 's' : ''} · tu pase de tienda` : 'Tu pase de tienda para probarte'} onPress={() => router.push('/mis-cosas/reservas')} />
          <FilaEnlace icono={ArrowsClockwise} titulo="Pendientes de enviar" detalle="Lo guardado sin red y el modo demo" onPress={() => router.push('/mis-cosas/pendientes')} />
          <FilaEnlace icono={Bell} titulo="Avisos" detalle="Cuando vuelva tu talla" onPress={() => router.push('/mis-cosas/avisos')} />
          <FilaEnlace icono={Storefront} titulo="Cambiar de tienda" detalle={`Estás en ${nombre}`} onPress={() => router.push('/tiendas')} />
          <CerrarSesion tienda={nombre} />
        </View>
      </ScrollView>
    </Pantalla>
  );
}
