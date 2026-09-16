import React from 'react';
import { View } from 'react-native';
import { Sparkles, Glasses } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';

export function FittingRoomHeader() {
  return (
    <View className="px-5 py-3 border-b border-border/40 bg-card/60">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Icon as={Glasses} size={20} className="text-primary" />
          <Text className="text-lg font-bold text-foreground">
            Vestidor 3D
          </Text>
        </View>

        <Badge variant="outline" className="border-primary/30 bg-primary/10">
          <Icon as={Sparkles} size={11} className="text-primary mr-1" />
          <Text className="text-[10px] font-bold text-primary">
            Fase Final
          </Text>
        </Badge>
      </View>

      <Text className="text-xs text-muted-foreground mt-1">
        Probá la caída de prendas y combinaciones en tu maniquí táctil
      </Text>
    </View>
  );
}
