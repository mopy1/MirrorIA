import { Image } from 'expo-image';
import * as React from 'react';
import { FlatList, useWindowDimensions, View } from 'react-native';
import type { ImagenProductoDto } from '@/lib/db/tipos-espejo';
import { cn } from '@/lib/utils';

/** Fotos a sangre 4:5 con paginado horizontal y puntos de posición. */
export function GaleriaFicha({ imagenes, nombre }: { imagenes: ImagenProductoDto[]; nombre: string }) {
  const { width } = useWindowDimensions();
  const [actual, setActual] = React.useState(0);
  const fotos = [...imagenes].sort((a, b) => a.orden - b.orden);
  if (!fotos.length) return <View className="bg-muted" style={{ width, height: width * 1.25 }} />;
  return (
    <View>
      <FlatList
        data={fotos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(f, i) => `${f.url}-${i}`}
        onMomentumScrollEnd={(e) => setActual(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <Image source={item.url} style={{ width, height: width * 1.25 }} contentFit="cover" transition={200} accessibilityLabel={nombre} />
        )}
      />
      {fotos.length > 1 ? (
        <View className="absolute bottom-4 w-full flex-row justify-center gap-1.5">
          {fotos.map((f, i) => (
            <View key={`${f.url}-${i}`} className={cn('h-1.5 rounded-full bg-white', i === actual ? 'w-5' : 'w-1.5 opacity-60')} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
