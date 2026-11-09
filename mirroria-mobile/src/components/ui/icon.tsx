import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { cssInterop } from 'nativewind';
import type { Icon as PhosphorIcon, IconProps as PhosphorProps } from 'phosphor-react-native';
import * as React from 'react';

/**
 * Íconos SOLO Phosphor (D8 de la spec). Reemplaza el icon.tsx de React Native
 * Reusables, que traía otra librería de íconos. `className="text-primary size-5"` pinta y
 * dimensiona el ícono gracias a `cssInterop` (color → prop `color`, alto → `size`).
 *
 * @example <Icon as={Storefront} className="text-primary" size={20} weight="duotone" />
 */
type IconProps = PhosphorProps & { as: PhosphorIcon; className?: string };

function IconImpl({ as: IconComponent, ...props }: IconProps) {
  return <IconComponent {...props} />;
}

cssInterop(IconImpl, {
  className: {
    target: 'style',
    nativeStyleToProp: { color: 'color', height: 'size', width: 'size' },
  },
});

function Icon({ as: IconComponent, className, size = 18, weight = 'regular', ...props }: IconProps) {
  const textClass = React.useContext(TextClassContext);
  return (
    <IconImpl
      as={IconComponent}
      className={cn('text-foreground', textClass, className)}
      size={size}
      weight={weight}
      {...props}
    />
  );
}

export { Icon };
export type { PhosphorIcon };
