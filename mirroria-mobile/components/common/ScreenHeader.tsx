import React from 'react';
import { View } from 'react-native';
import { BrandLogo } from '@/components/brand-logo';
import { Text } from '@/components/ui/text';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  showLogo = true,
  rightAction,
}: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5 py-3.5 border-b border-border/40 bg-background">
      <View className="flex-row items-center gap-3 flex-1">
        {showLogo ? (
          <BrandLogo size="default" />
        ) : (
          <View>
            {title && (
              <Text className="text-xl font-bold tracking-tight text-foreground">
                {title}
              </Text>
            )}
            {subtitle && (
              <Text className="text-xs text-muted-foreground">{subtitle}</Text>
            )}
          </View>
        )}
      </View>

      {rightAction && (
        <View className="flex-row items-center gap-1.5">
          {rightAction}
        </View>
      )}
    </View>
  );
}
