import React from 'react';
import { Pressable, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BrandLogo } from '@/components/brand-logo';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  showLogo = true,
  showBack = false,
  rightAction,
}: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between px-5 py-3.5 border-b border-border/40 bg-background">
      <View className="flex-row items-center gap-3 flex-1">
        {showBack && (
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="w-8 h-8 -ml-1 items-center justify-center rounded-full active:bg-muted"
          >
            <Icon as={ChevronLeft} size={22} className="text-foreground" />
          </Pressable>
        )}
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
