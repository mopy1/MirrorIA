import { router } from 'expo-router';
import { ShoppingBag } from 'phosphor-react-native';
import { FlatList, View } from 'react-native';
import { EstadoVacio } from '@/components/common/EstadoVacio';
import { Pantalla } from '@/components/common/Pantalla';
import { Titulo } from '@/components/common/Titulo';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useSesion } from '@/contexts/SesionContext';
import { FilaCarrito } from '../components/FilaCarrito';
import { ResumenCarrito } from '../components/ResumenCarrito';
import { useCarritoLocal } from '../hooks/use-carrito-local';

/** Tab Carrito: visitante → iniciar sesión; clienta → su carrito (espejo, se ve sin red). */
export default function CarritoScreen() {
  const { sesion } = useSesion();
  const q = useCarritoLocal();
  const items = q.data ?? [];
  const total = items.reduce((s, i) => s + i.precioCents * i.cantidad, 0);
  const unidades = items.reduce((s, i) => s + i.cantidad, 0);

  if (!sesion) {
    return (
      <Pantalla className="justify-center">
        <EstadoVacio icono={ShoppingBag} titulo="Iniciá sesión para comprar" texto="Tu carrito se guarda en tu cuenta y lo ves también en la web.">
          <Button onPress={() => router.push('/acceso/login')}>
            <Text>Iniciar sesión</Text>
          </Button>
          <Button variant="outline" onPress={() => router.push('/acceso/registro')}>
            <Text>Crear cuenta</Text>
          </Button>
        </EstadoVacio>
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <View className="px-5 pb-2 pt-4">
        <Titulo nivel="display">Tu carrito</Titulo>
      </View>
      {q.isPending ? (
        <View className="gap-4 px-5 pt-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 justify-center">
          <EstadoVacio icono={ShoppingBag} titulo="Tu carrito está vacío" texto="Elegí una prenda en la vitrina y agregala acá.">
            <Button onPress={() => router.navigate('/vitrina')}>
              <Text>Ir a la vitrina</Text>
            </Button>
          </EstadoVacio>
        </View>
      ) : (
        <>
          <FlatList data={items} keyExtractor={(i) => i.varianteId} renderItem={({ item }) => <FilaCarrito item={item} />} contentContainerClassName="px-5" />
          <ResumenCarrito totalCents={total} unidades={unidades} />
        </>
      )}
    </Pantalla>
  );
}
