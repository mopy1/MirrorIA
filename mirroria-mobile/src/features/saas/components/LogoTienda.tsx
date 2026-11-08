import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { textoSobre } from '../../appearance/lib/color';
import { iniciales } from '../lib/marca-tienda';

interface Props {
  nombre: string;
  logoUrl: string | null;
  color: string | null;
  tamano?: number;
  className?: string;
}

/** Logo de la tienda; sin logo (o si no carga), sus iniciales sobre el color principal. */
export function LogoTienda({ nombre, logoUrl, color, tamano = 32, className }: Props) {
  const [fallo, setFallo] = useState(false);
  const fondo = color ?? '#26282E';
  const radio = Math.round(tamano * 0.28);

  if (logoUrl && !fallo) {
    return (
      <View
        className={cn('items-center justify-center overflow-hidden border border-border/60 bg-white', className)}
        style={{ width: tamano, height: tamano, borderRadius: radio }}
      >
        <Image
          source={{ uri: logoUrl }}
          style={{ width: tamano - 4, height: tamano - 4 }}
          resizeMode="contain"
          onError={() => setFallo(true)}
          accessibilityLabel={`Logo de ${nombre}`}
        />
      </View>
    );
  }
  return (
    <View
      className={cn('items-center justify-center', className)}
      style={{ width: tamano, height: tamano, borderRadius: radio, backgroundColor: fondo }}
      accessibilityLabel={`Logo de ${nombre}`}
    >
      <Text style={{ color: textoSobre(fondo), fontSize: Math.round(tamano * 0.38) }} className="font-bold">
        {iniciales(nombre)}
      </Text>
    </View>
  );
}
