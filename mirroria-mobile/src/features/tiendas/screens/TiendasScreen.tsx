import { router } from 'expo-router';
import { Storefront } from 'phosphor-react-native';
import { FlatList, RefreshControl, View } from 'react-native';
import { EstadoError } from '@/components/common/EstadoError';
import { EstadoVacio } from '@/components/common/EstadoVacio';
import { Pantalla } from '@/components/common/Pantalla';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTienda } from '@/contexts/TiendaContext';
import { CabeceraPlataforma } from '../components/CabeceraPlataforma';
import { ListaTiendasSkeleton } from '../components/ListaTiendasSkeleton';
import { TarjetaTienda } from '../components/TarjetaTienda';
import { useDirectorio } from '../hooks/use-directorio';
import { useElegirTienda } from '../hooks/use-elegir-tienda';

/** `/tiendas`: selector de boutique con el tema de MirrorIA. */
export default function TiendasScreen() {
  const q = useDirectorio();
  const { tienda } = useTienda();
  const elegir = useElegirTienda();
  const tiendas = q.data?.tiendas ?? [];

  return (
    <Pantalla>
      <FlatList
        data={tiendas}
        keyExtractor={(t) => t.id}
        contentContainerClassName="gap-4 px-5 pb-10"
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} />}
        ListHeaderComponent={<CabeceraPlataforma cantidad={tiendas.filter((t) => t.disponible).length || undefined} />}
        renderItem={({ item }) => <TarjetaTienda tienda={item} elegida={item.slug === tienda?.slug} onPress={() => void elegir(item)} />}
        ListEmptyComponent={
          q.isPending ? (
            <ListaTiendasSkeleton />
          ) : q.isError ? (
            <EstadoError error={q.error} titulo="Necesitás internet la primera vez" onReintentar={() => void q.refetch()} />
          ) : (
            <EstadoVacio icono={Storefront} titulo="Todavía no hay tiendas" texto="Cuando una boutique abra en MirrorIA, va a aparecer acá." />
          )
        }
        ListFooterComponent={
          tienda ? (
            <View className="pt-2">
              <Button variant="ghost" onPress={() => router.replace('/vitrina')}>
                <Text>Volver a {tienda.nombre}</Text>
              </Button>
            </View>
          ) : undefined
        }
      />
    </Pantalla>
  );
}
