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
import { mensajeDeError } from '@/lib/api/errores';
import { enCurso } from '@/lib/outbox/consultas';
import { useEstadoRed } from '@/lib/red/use-estado-red';
import { useOutbox } from '@/lib/outbox/use-outbox';
import { AvisoCompraPendiente } from '../components/AvisoCompraPendiente';
import { FilaCarritoDeslizable } from '../components/FilaCarritoDeslizable';
import { ResumenCarrito } from '../components/ResumenCarrito';
import { useCarritoLocal } from '../hooks/use-carrito-local';
import { useQuitarDelCarrito } from '../hooks/use-quitar-del-carrito';

/** Tab Carrito: visitante → iniciar sesión; clienta → su carrito (espejo + lo agregado sin red). */
export default function CarritoScreen() {
  const { sesion } = useSesion();
  const q = useCarritoLocal();
  const red = useEstadoRed();
  const quitar = useQuitarDelCarrito();
  const compra = useOutbox().mias.find((f) => f.tipo === 'CHECKOUT' && enCurso(f)) ?? null;
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
      {compra ? <AvisoCompraPendiente fila={compra} /> : null}
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
          <FlatList
            data={items}
            keyExtractor={(i) => i.varianteId}
            renderItem={({ item }) => (
              <FilaCarritoDeslizable item={item} habilitado={red.online && item.pendientes === 0 && !compra} quitando={quitar.isPending && quitar.variables === item.varianteId} onQuitar={quitar.mutate} />
            )}
            contentContainerClassName="px-5"
            ListFooterComponent={
              <Text className={`pt-3 text-xs ${quitar.error ? 'text-danger' : 'text-muted-foreground'}`}>
                {quitar.error ? mensajeDeError(quitar.error) : red.online ? 'Deslizá una prenda a la izquierda para quitarla.' : 'Sin conexión: para quitar prendas necesitás red.'}
              </Text>
            }
          />
          <ResumenCarrito totalCents={total} unidades={unidades} compraEnCurso={!!compra} />
        </>
      )}
    </Pantalla>
  );
}
