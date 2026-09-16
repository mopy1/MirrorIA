import React from 'react';
import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

import type { ColorValue } from 'react-native';

interface TabBarIconProps {
  icon: LucideIcon;
  focused: boolean;
  color?: string | ColorValue;
  size?: number;
  isCenterButton?: boolean;
}

export function TabBarIcon({
  icon,
  focused,
  color,
  size = 22,
  isCenterButton = false,
}: TabBarIconProps) {
  if (isCenterButton) {
    return (
      <View className="items-center justify-center -top-2">
        <View
          className={`w-12 h-12 rounded-full items-center justify-center shadow-lg ${
            focused
              ? 'bg-primary shadow-primary/40'
              : 'bg-primary/90 shadow-primary/20'
          }`}
        >
          <Icon as={icon} size={24} className="text-primary-foreground" />
        </View>
      </View>
    );
  }

  return (
    <View className="items-center justify-center">
      <Icon as={icon} size={size} color={color} />
      {focused && (
        <View className="w-1 h-1 rounded-full bg-primary mt-1 absolute -bottom-2" />
      )}
    </View>
  );
}
