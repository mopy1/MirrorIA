import React from 'react';
import { View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export interface BrandLogoProps {
  className?: string;
  iconSize?: number;
  size?: 'sm' | 'default' | 'lg' | 'xl';
  variant?: 'default' | 'subtle' | 'light';
  withText?: boolean;
  subtitle?: string;
}

export function BrandLogo({
  className,
  iconSize,
  size = 'default',
  variant = 'default',
  withText = true,
  subtitle,
}: BrandLogoProps) {
  const isLight = variant === 'light';
  const isSubtle = variant === 'subtle';

  const sizeConfig = {
    sm: {
      box: 'w-7 h-7 rounded-lg',
      icon: 14,
      text: 'text-base',
    },
    default: {
      box: 'w-8 h-8 rounded-lg',
      icon: 16,
      text: 'text-lg',
    },
    lg: {
      box: 'w-10 h-10 rounded-xl',
      icon: 20,
      text: 'text-xl',
    },
    xl: {
      box: 'w-14 h-14 rounded-2xl',
      icon: 26,
      text: 'text-2xl',
    },
  }[size];

  const calculatedIconSize = iconSize ?? sizeConfig.icon;

  const badgeStyles = isLight
    ? 'bg-white/15 border border-white/20'
    : isSubtle
      ? 'bg-primary/10 border border-primary/20'
      : 'bg-primary shadow-sm';

  const iconColorClass = isLight
    ? 'text-white'
    : isSubtle
      ? 'text-primary'
      : 'text-primary-foreground';

  return (
    <View className={cn('flex-row items-center gap-2.5', className)}>
      <View
        className={cn(
          'items-center justify-center shrink-0',
          sizeConfig.box,
          badgeStyles
        )}
      >
        <Icon as={Sparkles} size={calculatedIconSize} className={iconColorClass} />
      </View>

      {withText && (
        <View className="flex-col">
          <Text
            className={cn(
              'font-bold tracking-tight',
              sizeConfig.text,
              isLight ? 'text-white' : 'text-foreground'
            )}
          >
            Mirror
            <Text
              className={cn(
                'font-bold',
                isLight ? 'text-primary-foreground font-extrabold' : 'text-primary'
              )}
            >
              IA
            </Text>
          </Text>
          {subtitle && (
            <Text
              className={cn(
                'text-xs tracking-normal mt-0.5',
                isLight ? 'text-white/75' : 'text-muted-foreground'
              )}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
