import * as React from 'react';
import { Text as RNText } from 'react-native';
import { useTema } from '@/contexts/TemaContext';
import { cn } from '@/lib/utils';

type Nivel = 'display' | 'h1' | 'h2' | 'h3';

const TAMANO: Record<Nivel, string> = {
  display: 'text-[32px] leading-[36px]',
  h1: 'text-2xl leading-8',
  h2: 'text-xl leading-7',
  h3: 'text-base leading-6',
};

/** Títulos con la fuente de la marca (o Bricolage en MirrorIA), escala 32/24/20/16, tracking −0.5. */
export function Titulo({ nivel = 'h1', className, style, ...props }: React.ComponentProps<typeof RNText> & { nivel?: Nivel }) {
  const { familiaTitulos } = useTema();
  return (
    <RNText
      accessibilityRole="header"
      className={cn('text-foreground', TAMANO[nivel], className)}
      style={[{ fontFamily: familiaTitulos, letterSpacing: -0.5 }, style]}
      {...props}
    />
  );
}
