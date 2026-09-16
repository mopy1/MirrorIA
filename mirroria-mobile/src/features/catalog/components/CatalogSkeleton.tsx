import React from 'react';
import { View } from 'react-native';

export function CatalogSkeleton() {
  const dummyArray = Array.from({ length: 6 });

  return (
    <View className="flex-row flex-wrap px-2 pt-2">
      {dummyArray.map((_, index) => (
        <View key={index} className="w-1/2 p-1.5">
          <View className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <View className="w-full aspect-[4/5] bg-muted animate-pulse" />
            <View className="p-3 gap-2">
              <View className="w-4/5 h-3 bg-muted rounded animate-pulse" />
              <View className="w-1/2 h-4 bg-muted rounded animate-pulse" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
