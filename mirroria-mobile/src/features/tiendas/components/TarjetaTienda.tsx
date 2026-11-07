import { Image } from 'expo-image';
import { ArrowRight, CheckCircle } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';
import { LogoTienda } from '@/components/common/LogoTienda';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { urlImagen } from '@/lib/config';
import { cn } from '@/lib/utils';
import type { TiendaDirectorio } from '../types/tienda.types';

interface Props {
  tienda: TiendaDirectorio;
  elegida: boolean;
  onPress: () => void;
}

/** Tarjeta editorial de una boutique: su portada, su logo y sus dos colores. */
export function TarjetaTienda({ tienda, elegida, onPress }: Props) {
  const m = tienda.marca;
  const portada = urlImagen(m?.hero.imagenUrl);
  return (
    <Pressable
      onPress={onPress}
      disabled={!tienda.disponible}
      accessibilityRole="button"
      accessibilityLabel={`Entrar a ${tienda.nombre}`}
      className={cn('overflow-hidden rounded-2xl border border-border bg-card active:opacity-90', !tienda.disponible && 'opacity-50')}
    >
      <View className="h-36 bg-muted">
        {portada ? <Image source={portada} style={{ flex: 1 }} contentFit="cover" transition={200} /> : null}
        <View className="absolute bottom-3 left-3 flex-row gap-1.5">
          {[m?.colorPrimario, m?.colorAcento].filter(Boolean).map((c) => (
            <View key={c} className="h-4 w-4 rounded-full border-2 border-white" style={{ backgroundColor: c! }} />
          ))}
        </View>
        {elegida ? (
          <View className="absolute right-3 top-3 flex-row items-center gap-1 rounded-full bg-brand-accent px-2.5 py-1">
            <Icon as={CheckCircle} size={14} weight="fill" className="text-brand-accent-foreground" />
            <Text className="font-body-semibold text-xs text-brand-accent-foreground">Elegida</Text>
          </View>
        ) : null}
      </View>
      <View className="flex-row items-center gap-3 p-4">
        <LogoTienda tienda={tienda} tamano={40} />
        <View className="flex-1">
          <Text className="font-body-semibold text-base">{tienda.nombre}</Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {tienda.disponible ? m?.textos.eslogan ?? 'Boutique en MirrorIA' : 'No disponible por ahora'}
          </Text>
        </View>
        {tienda.disponible ? <Icon as={ArrowRight} size={20} className="text-muted-foreground" /> : null}
      </View>
    </Pressable>
  );
}
