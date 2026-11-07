import { Image } from 'expo-image';
import { View } from 'react-native';
import { LogoTienda } from '@/components/common/LogoTienda';
import { Titulo } from '@/components/common/Titulo';
import { Text } from '@/components/ui/text';
import { useTienda } from '@/contexts/TiendaContext';
import { urlImagen } from '@/lib/config';

/** Foto de la marca a sangre + logo + título: el acceso se siente de ESA boutique. */
export function CabeceraAcceso({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  const { tienda } = useTienda();
  if (!tienda) return null;
  const foto = urlImagen(tienda.marca?.imagenes.acceso ?? tienda.marca?.hero.imagenUrl);
  return (
    <View>
      <View className="h-44 overflow-hidden bg-muted">
        {foto ? <Image source={foto} style={{ flex: 1 }} contentFit="cover" contentPosition="top" transition={200} /> : null}
      </View>
      <View className="-mt-7 px-6">
        <View className="self-start rounded-full border-4 border-background">
          <LogoTienda tienda={tienda} tamano={48} />
        </View>
        <Titulo nivel="h1" className="mt-3">
          {titulo}
        </Titulo>
        <Text className="mt-1 text-sm text-muted-foreground">{subtitulo}</Text>
      </View>
    </View>
  );
}
