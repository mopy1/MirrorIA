import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Sparkle } from 'phosphor-react-native';
import { Text as RNText, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTema } from '@/contexts/TemaContext';
import { useTienda } from '@/contexts/TiendaContext';
import { Velo } from '@/components/common/Velo';
import { urlImagen } from '@/lib/config';

/** Tab Probador (D7): reservado "Próximamente" hasta M4 (Decart, development build). */
export default function ProbadorScreen() {
  const { tienda } = useTienda();
  const { familiaTitulos } = useTema();
  const foto = urlImagen(tienda?.marca?.imagenes.probador ?? tienda?.marca?.hero.imagenUrl);
  return (
    <View className="flex-1 bg-black">
      {foto ? <Image source={foto} style={{ position: 'absolute', inset: 0 }} contentFit="cover" transition={200} /> : null}
      <Velo opacidad={0.9} />
      <View className="flex-1 justify-end px-6" style={{ paddingBottom: 28 }}>
        <View className="mb-4 flex-row items-center gap-2 self-start rounded-full bg-white/15 px-3 py-1.5">
          <Icon as={Sparkle} size={14} weight="fill" className="text-white" />
          <Text className="font-body-semibold text-xs text-white">Llega en la próxima versión</Text>
        </View>
        <RNText className="text-white" style={{ fontFamily: familiaTitulos, fontSize: 32, lineHeight: 36, letterSpacing: -0.6 }}>
          Probador con IA
        </RNText>
        <Text className="mt-3 text-sm leading-5 text-white/85">
          Vas a verte en vivo con la prenda puesta usando la cámara frontal, antes de reservarla o comprarla.
        </Text>
        <Button size="lg" className="mt-6 h-[52px]" onPress={() => router.navigate('/vitrina')}>
          <Text>Ver vitrina</Text>
        </Button>
      </View>
    </View>
  );
}
