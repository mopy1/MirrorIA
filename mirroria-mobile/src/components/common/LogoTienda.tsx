import { Image } from 'expo-image';
import * as React from 'react';
import type { TiendaDirectorio } from '@/features/tiendas/types/tienda.types';
import { urlImagen } from '@/lib/config';
import { MonogramaTienda } from './MonogramaTienda';

/** Logo de la marca o, si no hay o no carga (p. ej. sin la web levantada), su monograma. */
export function LogoTienda({ tienda, tamano = 40 }: { tienda: Pick<TiendaDirectorio, 'nombre' | 'marca'>; tamano?: number }) {
  const [fallo, setFallo] = React.useState(false);
  const url = urlImagen(tienda.marca?.logoUrl);
  const color = tienda.marca?.colorPrimario ?? '#26282E';
  if (!url || fallo) return <MonogramaTienda nombre={tienda.nombre} color={color} tamano={tamano} />;
  return (
    <Image
      source={url}
      style={{ width: tamano, height: tamano, borderRadius: tamano / 2 }}
      contentFit="contain"
      onError={() => setFallo(true)}
      accessibilityLabel={`Logo de ${tienda.nombre}`}
    />
  );
}
