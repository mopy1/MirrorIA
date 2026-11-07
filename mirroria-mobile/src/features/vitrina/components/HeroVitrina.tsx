import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Scan } from 'phosphor-react-native';
import { Pressable, Text as RNText, View } from 'react-native';
import { LogoTienda } from '@/components/common/LogoTienda';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTema } from '@/contexts/TemaContext';
import type { TiendaDirectorio } from '@/features/tiendas/types/tienda.types';
import { urlImagen } from '@/lib/config';
import { Velo } from '@/components/common/Velo';

/** Portada de la marca a sangre, con su título; "Escanear etiqueta" como acción secundaria de cabecera. */
export function HeroVitrina({ tienda, insetSuperior }: { tienda: TiendaDirectorio; insetSuperior: number }) {
  const { familiaTitulos } = useTema();
  const hero = tienda.marca?.hero;
  const foto = urlImagen(hero?.imagenUrl);
  return (
    <View style={{ height: 380 + insetSuperior }} className="bg-muted">
      {foto ? <Image source={foto} style={{ flex: 1 }} contentFit="cover" transition={200} /> : null}
      <Velo />
      <View className="absolute left-0 right-0 flex-row items-center gap-2.5 px-5" style={{ top: insetSuperior + 10 }}>
        <LogoTienda tienda={tienda} tamano={34} />
        <RNText className="flex-1 text-white" style={{ fontFamily: familiaTitulos, fontSize: 17 }} numberOfLines={1}>
          {tienda.nombre}
        </RNText>
        <Pressable
          onPress={() => router.push('/vitrina/escanear')}
          accessibilityRole="button"
          accessibilityLabel="Escanear etiqueta"
          className="h-10 flex-row items-center gap-1.5 rounded-full bg-black/35 px-3.5 active:bg-black/50"
        >
          <Icon as={Scan} size={18} weight="bold" className="text-white" />
          <Text className="font-body-medium text-xs text-white">Escanear</Text>
        </Pressable>
      </View>
      <View className="absolute bottom-0 left-0 right-0 px-5 pb-7">
        <RNText className="text-white" style={{ fontFamily: familiaTitulos, fontSize: 32, lineHeight: 36, letterSpacing: -0.6 }}>
          {hero?.titulo ?? tienda.nombre}
        </RNText>
        {hero?.subtitulo ? (
          <Text className="mt-2 text-sm leading-5 text-white/85" numberOfLines={2}>
            {hero.subtitulo}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
