import * as React from 'react';
import { View } from 'react-native';
import { Icon, type PhosphorIcon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Titulo } from './Titulo';

interface Props {
  icono: PhosphorIcon;
  titulo: string;
  texto?: string;
  /** Acción primaria (y, si hace falta, secundaria en outline/ghost). */
  children?: React.ReactNode;
  className?: string;
  tono?: 'neutro' | 'aviso' | 'error';
}

const TONO = { neutro: 'text-primary', aviso: 'text-warning', error: 'text-danger' } as const;
const FONDO = { neutro: 'bg-primary/10', aviso: 'bg-warning/10', error: 'bg-danger/10' } as const;

/** Estado vacío/error accionable: ícono + texto + acción, nunca un cuadro en blanco. */
export function EstadoVacio({ icono, titulo, texto, children, className, tono = 'neutro' }: Props) {
  return (
    <View className={cn('items-center px-8 py-12', className)}>
      <View className={cn('mb-5 h-16 w-16 items-center justify-center rounded-full', FONDO[tono])}>
        <Icon as={icono} size={28} weight="duotone" className={TONO[tono]} />
      </View>
      <Titulo nivel="h2" className="text-center">
        {titulo}
      </Titulo>
      {texto ? <Text className="mt-2 max-w-xs text-center text-sm leading-5 text-muted-foreground">{texto}</Text> : null}
      {children ? <View className="mt-6 w-full max-w-xs gap-2">{children}</View> : null}
    </View>
  );
}
