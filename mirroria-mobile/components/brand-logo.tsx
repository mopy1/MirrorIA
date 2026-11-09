import React from 'react';
import { View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { LogoTienda } from '@/src/features/saas/components/LogoTienda';
import { useMarcaTienda } from '@/src/features/saas/hooks/useMarcaTienda';

export interface BrandLogoProps {
  className?: string;
  iconSize?: number;
  size?: 'sm' | 'default' | 'lg' | 'xl';
  variant?: 'default' | 'subtle' | 'light';
  withText?: boolean;
  subtitle?: string;
  /** true: la marca de la plataforma (MirrorIA) en vez de la de la tienda actual. */
  plataforma?: boolean;
}

const TAMANOS = {
  sm: { box: 'w-7 h-7 rounded-lg', caja: 28, icon: 14, text: 'text-base' },
  default: { box: 'w-8 h-8 rounded-lg', caja: 32, icon: 16, text: 'text-lg' },
  lg: { box: 'w-10 h-10 rounded-xl', caja: 40, icon: 20, text: 'text-xl' },
  xl: { box: 'w-14 h-14 rounded-2xl', caja: 56, icon: 26, text: 'text-2xl' },
} as const;

/**
 * La marca que se ve arriba: el logo (o las iniciales) y el nombre de la
 * tienda en la que está la app. Mientras la ficha de la tienda no llegó, o
 * si se pide `plataforma`, se ve la de MirrorIA.
 */
export function BrandLogo({
  className,
  iconSize,
  size = 'default',
  variant = 'default',
  withText = true,
  subtitle,
  plataforma = false,
}: BrandLogoProps) {
  const { marca } = useMarcaTienda();
  const t = TAMANOS[size];
  const isLight = variant === 'light';
  const isSubtle = variant === 'subtle';

  if (marca && !plataforma) {
    return (
      <View className={cn('flex-row items-center gap-2.5', className)}>
        <LogoTienda nombre={marca.nombre} logoUrl={marca.logoUrl} color={marca.colorPrimario} tamano={t.caja} />
        {withText && (
          <View className="flex-col shrink">
            <Text numberOfLines={1} className={cn('font-bold tracking-tight', t.text, isLight ? 'text-white' : 'text-foreground')}>
              {marca.nombre}
            </Text>
            {subtitle && (
              <Text className={cn('text-xs tracking-normal mt-0.5', isLight ? 'text-white/75' : 'text-muted-foreground')}>
                {subtitle}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  const badgeStyles = isLight
    ? 'bg-white/15 border border-white/20'
    : isSubtle
      ? 'bg-primary/10 border border-primary/20'
      : 'bg-primary shadow-sm';
  const iconColorClass = isLight ? 'text-white' : isSubtle ? 'text-primary' : 'text-primary-foreground';

  return (
    <View className={cn('flex-row items-center gap-2.5', className)}>
      <View className={cn('items-center justify-center shrink-0', t.box, badgeStyles)}>
        <Icon as={Sparkles} size={iconSize ?? t.icon} className={iconColorClass} />
      </View>
      {withText && (
        <View className="flex-col">
          <Text className={cn('font-bold tracking-tight', t.text, isLight ? 'text-white' : 'text-foreground')}>
            Mirror
            <Text className={cn('font-bold', isLight ? 'text-primary-foreground font-extrabold' : 'text-primary')}>IA</Text>
          </Text>
          {subtitle && (
            <Text className={cn('text-xs tracking-normal mt-0.5', isLight ? 'text-white/75' : 'text-muted-foreground')}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
