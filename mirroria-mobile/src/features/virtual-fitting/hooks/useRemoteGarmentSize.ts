import { useEffect, useState } from 'react';
import { Image } from 'react-native';

interface RemoteImageSize {
  width: number;
  height: number;
}

/**
 * Tamaño real (px) de una imagen remota — a diferencia del PNG de prueba
 * local (`require`, tamaño conocido de antemano), una `arOverlayImageUrl`
 * real hay que medirla para poder escalarla correctamente en el overlay.
 * Devuelve `null` mientras carga o si `uri` es `null`/falla la descarga.
 */
export function useRemoteGarmentSize(uri: string | null | undefined) {
  const [size, setSize] = useState<RemoteImageSize | null>(null);

  useEffect(() => {
    if (!uri) {
      setSize(null);
      return;
    }

    let cancelled = false;
    setSize(null);
    Image.getSize(
      uri,
      (width, height) => {
        if (!cancelled) setSize({ width, height });
      },
      () => {
        if (!cancelled) setSize(null);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [uri]);

  return size;
}
